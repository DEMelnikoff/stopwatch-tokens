
var filename_prefix = jsPsych.data.getURLVariable('PROLIFIC_PID');
if (!filename_prefix) { filename_prefix = jsPsych.randomization.randomID(10) };
var myfilename = filename_prefix + "_combined.csv";

var experiment_id = "aCRxZ1xGTr3l";
var prolific_completion_code = "YOUR_PROLIFIC_COMPLETION_CODE";

var condition_assignment;
var stopwatch_instructions_html;
const rand_num = Math.random();

if (rand_num < 0.33333) {
    condition_assignment = 1; // Intrinsic motivation
} else if (rand_num < 0.66666) {
    condition_assignment = 2; // Competitive - Average
} else {
    condition_assignment = 3; // Competitive - Count
}

jsPsych.data.addProperties({
    condition: condition_assignment
});

const stopwatch_base_instructions = `<div class="instructions" style="text-align: left; max-width: 600px; margin: auto;">
    <h2>Game #2: Stopwatch Game</h2>
    <p>Welcome to the Stopwatch Game!</p>
    <p>The rules are simple: click the button or press the <strong>SPACEBAR</strong> when the timer shows <strong>5.00 seconds</strong>.</p>
    <p>A scoreboard will track your hits between 4.95s and 5.05s.</p>`;

let condition_specific_paragraph = '';
switch (condition_assignment) {
    case 1:
        condition_specific_paragraph = `<p>Your goal is to stop the timer as close to 5.00 seconds as possible on each turn. Good luck!</p>`;
        break;
    case 2:
        condition_specific_paragraph = `<p>To make things interesting, the top 10 players who get the <strong>closest to 5.00 seconds on average</strong> across all turns will receive a monetary reward of $10.</p>`;
        break;
    case 3:
        condition_specific_paragraph = `<p>To make things interesting, the top 10 players who get the <strong>most hits </strong>between 4.95s and 5.05s will receive a monetary reward of $10.</p>`;
        break;
}

stopwatch_instructions_html = stopwatch_base_instructions + condition_specific_paragraph + `<p>You will play this game 30 times.</p><p>Click "Start Game" when you're ready.</p></div>`;

var quizQuestions = [];
fetch('./quiz_questions.json')
    .then(response => response.json())
    .then(data => {
        quizQuestions = data.questions;
    })
    .catch(error => {
        console.error('Error loading quiz questions:', error);
        quizQuestions = [
            {
                question: "What is 2 + 2?",
                options: ["3", "4", "5", "6"],
                correct: 1
            },
        ];
    });

function createStopwatchTask(repetitions = 30, taskName = "stopwatch", instructions_html) {
    let stopwatchTrials = [];
    let score = 0;
    const TARGET_TIME = 5;
    const PERFECT_WINDOW = 0.050; // 50ms

    const instructions = {
        type: 'html-button-response',
        stimulus: instructions_html,
        choices: ['Start Game'],
        button_html: '<button class="jspsych-btn" style="font-size: 20px; padding: 15px 30px;">%choice%</button>'
    };

    stopwatchTrials.push(instructions);

    for (let i = 0; i < repetitions; i++) {
        const stopwatch_trial = {
            type: 'html-keyboard-response',
            choices: jsPsych.NO_KEYS,
            stimulus: function() {
                // This stimulus function is the same, showing the score at the start of the trial
                return `
                    <div style="position: relative; width: 400px; margin: auto;">
                        <div id="scoreboard" style="position: absolute; top: -40px; right: 0; background-color: rgba(0,0,0,0.3); color: white; padding: 5px 15px; border-radius: 15px; font-size: 24px; font-family: sans-serif;">
                            ${score}
                        </div>
                    </div>
                    <button id="stopwatch-task-btn" class="jspsych-btn" style="background-color: blue; color: white; width: 400px; height: 200px; border-radius: 10px; display: flex; justify-content: center; align-items: center; box-shadow: 0 5px 15px rgba(0,0,0,0.2); border: none; outline: none;">
                        <div id="stopwatch-display" style="font-size: 60px; font-family: monospace; font-weight: bold; line-height: 1;">0.00</div>
                    </button>
                `;
            },
            data: { task: taskName, trial_index: i, target_time: TARGET_TIME },
            on_load: function() {
                const startTime = performance.now();
                const display = document.getElementById('stopwatch-display');
                const button = document.getElementById('stopwatch-task-btn');
                let trialEnded = false; // Flag to prevent finishing the trial more than once

                let stopwatchInterval = setInterval(function() {
                    let elapsed = (performance.now() - startTime) / 1000;
                    if (elapsed <= 10 && display && !trialEnded) {
                        display.innerHTML = elapsed.toFixed(2);
                    } else {
                        clearInterval(stopwatchInterval);
                    }
                }, 10);

                const handleStopwatchEnd = (rt) => {
                    if (trialEnded) return; // Ensure this only runs once
                    trialEnded = true;

                    // Clean up timers and listeners
                    clearTimeout(trialTimeout);
                    clearInterval(stopwatchInterval);
                    document.removeEventListener('keydown', keyboardListener);
                    if (button) {
                        button.onclick = null;
                        button.disabled = true; // Disable the button to match free-play behavior
                    }
                    
                    const score_at_start_of_trial = score;
                    const stopwatch_completed = rt !== null;
                    let stopwatch_time = null;
                    let is_perfect = false;
                    let new_score = score;

                    if (stopwatch_completed) {
                        const clickTime = rt / 1000;
                        stopwatch_time = parseFloat(clickTime.toFixed(2));
                        is_perfect = Math.abs(clickTime - TARGET_TIME) <= PERFECT_WINDOW;
                        if(display) display.innerHTML = stopwatch_time.toFixed(2);
                    } else {
                        // Handle trial timeout
                        if(display) {
                            display.innerHTML = "Missed!";
                            display.style.fontSize = "48px";
                        }
                    }

                    if (is_perfect) {
                        score++; // Increment score for the next trial
                        new_score = score;
                        // **FIX: Added 1.5 second delay to the score flash**
                        setTimeout(() => {
                            const scoreboardEl = document.getElementById('scoreboard');
                            if (scoreboardEl) {
                                scoreboardEl.textContent = new_score;
                                scoreboardEl.style.backgroundColor = '#ffc107';
                                scoreboardEl.style.color = 'black';
                                setTimeout(() => {
                                   scoreboardEl.style.backgroundColor = 'rgba(0,0,0,0.3)';
                                   scoreboardEl.style.color = 'white';
                                }, 250);
                            }
                        }, 1500);
                    }

                    // End the trial after a 3-second feedback period
                    setTimeout(() => {
                        jsPsych.finishTrial({
                            rt: rt,
                            stopwatch_completed: stopwatch_completed,
                            stopwatch_time: stopwatch_time,
                            is_perfect: is_perfect,
                            score: score_at_start_of_trial,
                            new_score: new_score
                        });
                    }, 3000);
                };

                // Set a 10-second timeout for the trial
                const trialTimeout = setTimeout(() => handleStopwatchEnd(null), 10000);

                // Add event listeners
                button.onclick = () => handleStopwatchEnd(performance.now() - startTime);
                const keyboardListener = (e) => {
                    if (e.key === ' ') {
                        e.preventDefault();
                        handleStopwatchEnd(performance.now() - startTime);
                    }
                };
                document.addEventListener('keydown', keyboardListener);
            }
        };

        stopwatchTrials.push(stopwatch_trial);
    }
    return { timeline: stopwatchTrials };
}

function createFreePlaySection() {
    let freePlayState = {
        startTime: null,
        duration: 5 * 60 * 1000,
        currentGame: 'stopwatch',
        score: 0,
        isFeedbackActive: false,
        timerInterval: null
    };

    const TARGET_TIME = 5;
    const PERFECT_WINDOW = 0.050;

    const freePlayIntro = {
        type: 'html-button-response',
        stimulus: `<div style="text-align: left; max-width: 600px; margin: auto;"><h2>Free Play Session</h2><p>This session will last for 5 minutes. You can switch between the Stopwatch Game and a Quiz Game at any time using the control panel that will appear above the game.</p><p>In the Stopwatch Game, you can click the button or press the <strong>SPACEBAR</strong>.</p></div>`,
        choices: ['Start Free Play'],
        button_html: '<button class="jspsych-btn" style="font-size: 20px; padding: 15px 30px;">%choice%</button>',
        on_finish: function() {
            freePlayState.startTime = Date.now();
            freePlayState.timerInterval = setInterval(() => {
                const timerEl = document.getElementById('free-play-timer');
                if (timerEl) {
                    const elapsed = Date.now() - freePlayState.startTime;
                    const remaining = Math.max(0, freePlayState.duration - elapsed);
                    const minutes = Math.floor(remaining / 1000 / 60);
                    const seconds = Math.floor((remaining / 1000) % 60);
                    timerEl.innerHTML = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            }, 250);
        }
    };

    const freePlayLoop = {
        timeline: [{
            type: 'html-keyboard-response',
            stimulus: function() {
                const elapsed = Date.now() - freePlayState.startTime;
                const remaining = Math.max(0, freePlayState.duration - elapsed);
                const minutes = Math.floor(remaining / 1000 / 60);
                const seconds = Math.floor((remaining / 1000) % 60);
                const timer_text = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                const switch_button_text = `Switch to ${freePlayState.currentGame === 'stopwatch' ? 'Quiz' : 'Stopwatch'}`;

                const ui_html = `
                    <div id="free-play-ui-container" style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 20px; padding: 10px; font-family: sans-serif; width: 320px; margin: auto; border: 1px solid #ccc; border-radius: 10px;">
                        <div id="free-play-timer" style="font-weight: bold; color: black; font-size: 18px;">${timer_text}</div>
                        <button id="free-play-switch-btn" class="jspsych-btn" style="width: 180px;">${switch_button_text}</button>
                    </div>
                `;

                let game_html = '';
                if (freePlayState.currentGame === 'stopwatch') {
                    game_html = `
                        <div style="position: relative; width: 400px; margin: auto;">
                            <div id="stopwatch-score" style="position: absolute; top: -40px; right: 0; background-color: rgba(0,0,0,0.3); color: white; padding: 5px 15px; border-radius: 15px; font-size: 24px; font-family: sans-serif; transition: background-color 0.2s, color 0.2s;">
                                ${freePlayState.score}
                            </div>
                            <button id="stopwatch-btn" class="jspsych-btn" style="background-color: blue; color: white; width: 400px; height: 200px; border-radius: 10px; display: flex; justify-content: center; align-items: center; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                                <div id="stopwatch-display" style="font-size: 60px; font-family: monospace; font-weight: bold; line-height: 1;">0.00</div>
                            </button>
                        </div>
                    `;
                } else {
                    const q = jsPsych.randomization.sampleWithoutReplacement(quizQuestions, 1)[0];
                    jsPsych.currentTrial().quiz_data = q;
                    game_html = `<div id="quiz-container" style="width:100%; max-width: 500px; margin: auto; text-align: center;">`;
                    game_html += `<p style="font-size: 20px; margin-bottom: 20px; min-height: 60px; display: flex; align-items: center; justify-content: center;">${q.question}</p>`;
                    game_html += `<div id="quiz-options">`;
                    q.options.forEach((option, index) => {
                        game_html += `<button class="jspsych-btn quiz-option" data-index="${index}" style="display: block; width: 100%; margin: 10px auto; padding: 15px; font-size: 16px;">${option}</button>`;
                    });
                    game_html += `</div>`;
                    game_html += `<div id="quiz-feedback-placeholder" style="height: 80px; margin-top: 20px;"></div>`;
                    game_html += `</div>`;
                }

                // --- KEY FIX IS HERE ---
                // We return the UI, followed by a stable container for the game.
                // padding-top: 50px creates a safe zone for the scoreboard to pop into.
                // min-height: 350px creates a stable area that prevents the UI panel from jiggling.
                return `
                    ${ui_html}
                    <div id="game-area-container" style="padding-top: 50px; min-height: 350px;">
                        ${game_html}
                    </div>
                `;
            },
            choices: jsPsych.NO_KEYS,
            on_load: function() {
                const switch_btn = document.getElementById('free-play-switch-btn');
                switch_btn.addEventListener('click', () => {
                    freePlayState.isFeedbackActive = false;
                    freePlayState.currentGame = freePlayState.currentGame === 'stopwatch' ? 'quiz' : 'stopwatch';
                    jsPsych.finishTrial();
                });

                if (freePlayState.currentGame === 'stopwatch') {
                    setupStopwatchGame();
                } else {
                    setupQuizGame(jsPsych.currentTrial().quiz_data);
                }
            }
        }],
        loop_function: () => (Date.now() - freePlayState.startTime) < freePlayState.duration
    };

    function setupStopwatchGame() {
        const button = document.getElementById('stopwatch-btn');
        const display = document.getElementById('stopwatch-display');
        let stopwatchStartTime = performance.now();
        
        let stopwatchInterval = setInterval(() => {
            let elapsed = (performance.now() - stopwatchStartTime) / 1000;
            if (display && display.isConnected) {
                if (elapsed <= 10) {
                    display.innerHTML = elapsed.toFixed(2);
                } else {
                    handleStopwatchEnd(null);
                }
            } else {
                clearInterval(stopwatchInterval);
            }
        }, 10);

        const handleStopwatchEnd = (elapsedTime) => {
            clearInterval(stopwatchInterval);
            document.removeEventListener('keydown', spacebarListener);
            if (button) {
                button.onclick = null;
                button.disabled = true;
            }
            freePlayState.isFeedbackActive = true;
            const is_perfect = elapsedTime !== null && Math.abs(elapsedTime - TARGET_TIME) <= PERFECT_WINDOW;
            jsPsych.data.write({ task: 'free_play_stopwatch', stopwatch_time: elapsedTime, is_perfect: is_perfect, new_score: is_perfect ? freePlayState.score + 1 : freePlayState.score });
            if (display && elapsedTime !== null) { display.innerHTML = elapsedTime.toFixed(2); } else if (display) { display.innerHTML = "Missed!"; display.style.fontSize = "48px"; }
            if (is_perfect) {
                freePlayState.score++;
                setTimeout(() => {
                    const scoreboardEl = document.getElementById('stopwatch-score');
                    if (scoreboardEl) {
                        scoreboardEl.style.backgroundColor = '#ffc107'; scoreboardEl.style.color = 'black'; scoreboardEl.textContent = freePlayState.score;
                        setTimeout(() => { scoreboardEl.style.backgroundColor = 'rgba(0,0,0,0.3)'; scoreboardEl.style.color = 'white'; }, 250);
                    }
                }, 1500);
            }
            setTimeout(() => { if (freePlayState.isFeedbackActive) { freePlayState.isFeedbackActive = false; jsPsych.finishTrial(); } }, 3000);
        };

        button.onclick = () => { handleStopwatchEnd((performance.now() - stopwatchStartTime) / 1000); };
        const spacebarListener = (e) => { if (e.key === ' ') { e.preventDefault(); handleStopwatchEnd((performance.now() - stopwatchStartTime) / 1000); } };
        document.addEventListener('keydown', spacebarListener);
    }

    function setupQuizGame(quiz_data) {
        const option_buttons = document.querySelectorAll('.quiz-option');
        option_buttons.forEach(button => {
            button.onclick = (e) => {
                const selected_index = parseInt(e.currentTarget.dataset.index);
                const is_correct = selected_index === quiz_data.correct;
                jsPsych.data.write({ task: 'free_play_quiz', question: quiz_data.question, selected_option: selected_index, is_correct: is_correct });
                option_buttons.forEach(btn => btn.disabled = true);
                option_buttons.forEach((btn, index) => {
                    if (index === quiz_data.correct) { btn.style.backgroundColor = 'green'; btn.style.color = 'white'; }
                    else if (index === selected_index) { btn.style.backgroundColor = 'red'; btn.style.color = 'white'; }
                    else { btn.style.backgroundColor = '#ccc'; }
                });
                const feedback_placeholder = document.getElementById('quiz-feedback-placeholder');
                feedback_placeholder.innerHTML = `<h3 style="color: ${is_correct ? 'green' : 'red'};">${is_correct ? '✓ Correct!' : '✗ Incorrect'}</h3> <button id="feedback-next-btn" class="jspsych-btn">Next</button>`;
                document.getElementById('feedback-next-btn').onclick = () => jsPsych.finishTrial();
            };
        });
    }

    const freePlayEnd = {
        type: 'html-button-response',
        stimulus: `<div style="text-align: center; max-width: 600px; margin: auto;"><h2>Free Play Session Complete!</h2><p>The 5-minute free play session has ended.</p></div>`,
        choices: ['Continue'],
        on_load: function() {
            if (freePlayState.timerInterval) {
                clearInterval(freePlayState.timerInterval);
            }
        }
    };

    return {
        timeline: [freePlayIntro, freePlayLoop, freePlayEnd]
    };
}
var flowQs = function(shortName, getFullNameFn) {
    this.type = 'survey-likert';
    this.preamble = function() {
        let fullName = getFullNameFn();
        return `<div class='qInfo' style="text-align: left; max-width: 700px; margin: auto;"><p><strong>Thank you for playing ${fullName}!</strong></p><p>During ${fullName}, to what extent did you feel immersed and engaged in what you were doing?</p></div>`;
    };
    this.questions = function() {
        const fullName = getFullNameFn();
        return [
            { prompt: `During ${fullName}, how <b>absorbed</b> did you feel in what you were doing?`, name: 'F_absorbed_' + shortName, labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true },
            { prompt: `During ${fullName}, how <b>immersed</b> did you feel in what you were doing?`, name: 'F_immersed_' + shortName, labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true },
            { prompt: `During ${fullName}, how <b>engaged</b> did you feel in what you were doing?`, name: 'F_engaged_' + shortName, labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true },
            { prompt: `During ${fullName}, how <b>engrossed</b> did you feel in what you were doing?`, name: 'F_engrossed_' + shortName, labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true },
        ];
    };
    this.randomize_question_order = false;
    this.scale_width = 600;
    this.data = { questionnaire: 'flow', game_short: shortName };
};

var enjoyQs = function(shortName, getFullNameFn) {
    this.type = 'survey-likert';
    this.preamble = function() {
        let fullName = getFullNameFn();
        return `<div class='qInfo' style="text-align: left; max-width: 700px; margin: auto;"><p>Below are a few more questions about ${fullName}.</p><p>These questions ask about <strong>enjoyment</strong>.</p></div>`;
    };
    this.questions = function() {
        const fullName = getFullNameFn();
        return [
            { prompt: `How much did you <b>enjoy</b> playing ${fullName}?`, name: 'E_enjoyable_' + shortName, labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true },
            { prompt: `How much did you <b>like</b> playing ${fullName}?`, name: 'E_like_' + shortName, labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true },
            { prompt: `How much did you <b>dislike</b> playing ${fullName}?`, name: 'E_dislike_' + shortName, labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true },
            { prompt: `How much <b>fun</b> did you have playing ${fullName}?`, name: 'E_fun_' + shortName, labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true },
            { prompt: `How <b>entertaining</b> was ${fullName}?`, name: 'E_entertaining_' + shortName, labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true },
        ];
    };
    this.randomize_question_order = false;
    this.scale_width = 600;
    this.data = { questionnaire: 'enjoyment', game_short: shortName };
};



const holeInOneTask = {
    type: 'hole-in-one-game',
    stimulus: holeInOne.run, 
    total_shots: 4,  
    canvas_size: [475, 900],
    ball_color: 'white',
    ball_size: 10,
    ball_xPos: .13,
    ball_yPos: .5,
    wall_width: 75,
    wall_color: '#797D7F',
    wall_xPos: .9,
    hole_size: 75,
    friction: .02,
    tension: .03,
    data: { task: 'hole_in_one' },
    prompt: `<div class='instructions' style="text-align: left; max-width: 600px; margin: auto;">
    <p><strong>Hole in One</strong>. The goal of Hole in One is to shoot the ball through the hole. 
    Follow the instructions in the game area to play. You will have 10 shots.</p></div>`
};


var timeline = [];

timeline.push({ type: "external-html", url: "./html/consent.html", cont_btn: "advance" });
timeline.push({
    type: "instructions",
    pages: [`<div style="text-align: left; max-width: 800px; margin: auto;"><h2>Welcome to the Experiment!</h2><p>In this study, you will be helping us understand what makes games engaging.</p><p>You will play two different games and then have a "free play" session. After each part, you will answer a few questions about your experience.</p><p>The entire experiment will take about 10-15 minutes.</p><p>Click 'Next' to begin!</p></div>`],
    show_clickable_nav: true
});

timeline.push({
    type: "instructions",
    pages: [`<div style="text-align: left; max-width: 600px; margin: auto;"><h2>Game #1: Hole in One</h2><p>The first game you'll play is called Hole in One!</p><p>After you finish, you'll answer questions about your experience.</p><p>When you're ready to play, press "Next."</p></div>`],
    show_clickable_nav: true
});
timeline.push(holeInOneTask);

// timeline.push({
//     timeline: [
//         new flowQs('hole_in_one', () => 'the Hole in One game'),
//         new enjoyQs('hole_in_one', () => 'the Hole in One game')
//     ]
// });

timeline.push(createStopwatchTask(5, "stopwatch_game", stopwatch_instructions_html));


// timeline.push({
//     timeline: [
//         new flowQs('stopwatch', () => 'the Stopwatch Game'),
//         new enjoyQs('stopwatch', () => 'the Stopwatch Game')
//     ]
// });

timeline.push(createFreePlaySection());

timeline.push({
    type: 'survey-text',
    questions: [
        {prompt: "Please enter your age:", name: "age", required: true},
        {prompt: "Please enter your gender:", name: "gender", required: true},
        {prompt: "Do you have any comments about the experiment? (Optional)", name: "comments", rows: 4, columns: 50}
    ]
});

timeline.push({
    type: 'html-button-response',
    stimulus: `<h2>Experiment Complete!</h2><p>Thank you for your participation.</p><p>Your completion code is: <strong>${prolific_completion_code}</strong></p><p>Please copy this code and paste it into Prolific to receive credit.</p>`,
    choices: ['Finish']
});


/*
*
*  INITIALIZE & RUN EXPERIMENT
*
*/

jsPsych.init({
    timeline: timeline,
    on_finish: function() {
        jsPsych.data.addProperties({ completion_code: prolific_completion_code });
        // Save data to Pipe
        fetch("https://pipe.jspsych.org/api/data/", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "*/*" },
            body: JSON.stringify({
              experimentID: experiment_id,
              filename: myfilename,
              data: jsPsych.data.get().csv(),
            }),
        });
        // Redirect to Prolific
        document.body.innerHTML = `<div align='center' style="margin: 10%"><p>Thank you!</p><p>Please wait to be redirected to Prolific.</p></div>`;
        setTimeout(() => { location.href = `https://app.prolific.co/submissions/complete?cc=${prolific_completion_code}`; }, 3000);
    }
});