var filename_prefix = jsPsych.data.getURLVariable('PROLIFIC_PID');
if (!filename_prefix) { filename_prefix = jsPsych.randomization.randomID(10) };
var myfilename = filename_prefix + "_stopwatch.csv";
var experiment_id = "aCRxZ1xGTr3l";
var prolific_completion_code = "YOUR_PROLIFIC_COMPLETION_CODE";

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


function createStopwatchTask(repetitions = 15, taskName = "stopwatch", instructions_html) {
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
        // --- REFACTOR: Merged game and feedback into one trial for seamless feedback ---
        const trial = {
            type: 'html-keyboard-response', // Use a flexible type that doesn't auto-finish
            choices: jsPsych.NO_KEYS,
            trial_duration: 10000,
            stimulus: function() {
                return `
                    <div style="position: relative; width: 400px; margin: auto;">
                        <div id="scoreboard" style="position: absolute; top: -40px; right: 0; background-color: rgba(0,0,0,0.3); color: white; padding: 5px 15px; border-radius: 15px; font-size: 24px; font-family: sans-serif; transition: background-color 0.2s, color 0.2s;">
                            ${score}
                        </div>
                    </div>
                    <button id="stopwatch-task-btn" class="jspsych-btn" style="background-color: blue; color: white; width: 400px; height: 200px; border-radius: 10px; display: flex; justify-content: center; align-items: center; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                        <div id="stopwatch-display" style="font-size: 60px; font-family: monospace; font-weight: bold; line-height: 1;">0.00</div>
                    </button>
                `;
            },
            data: { task: taskName, trial_index: i, target_time: TARGET_TIME },
            on_load: function() {
                const startTime = performance.now();
                const display = document.getElementById('stopwatch-display');
                const button = document.getElementById('stopwatch-task-btn');

                let stopwatchInterval = setInterval(function() {
                    let elapsed = (performance.now() - startTime) / 1000;
                    if (elapsed <= 10) { 
                        if(display) display.innerHTML = elapsed.toFixed(2); 
                    } else { 
                        clearInterval(stopwatchInterval); // Stop if it runs over 10s
                    }
                }, 10);
                
                const handleResponse = (rt) => {
                    // 1. Stop interactions and timer
                    clearInterval(stopwatchInterval);
                    document.removeEventListener('keydown', keyboardListener);
                    button.onclick = null;
                    button.disabled = true;

                    // 2. Finalize display
                    const clickTime = rt / 1000;
                    const stopwatch_time = parseFloat(clickTime.toFixed(2));
                    if (display) display.innerHTML = stopwatch_time.toFixed(2);

                    // 3. Calculate results
                    const is_perfect = Math.abs(clickTime - TARGET_TIME) <= PERFECT_WINDOW;
                    const score_at_start_of_trial = score;
                    if(is_perfect) score++;

                    // 4. Visual feedback for score
                    if (is_perfect) {
                        setTimeout(function() {
                            const scoreboardEl = document.getElementById('scoreboard');
                            if (scoreboardEl) {
                                scoreboardEl.style.backgroundColor = '#ffc107';
                                scoreboardEl.style.color = 'black';
                                scoreboardEl.textContent = score; // Update to new score
                                setTimeout(() => {
                                   scoreboardEl.style.backgroundColor = 'rgba(0,0,0,0.3)';
                                   scoreboardEl.style.color = 'white';
                                }, 250);
                            }
                        }, 1500);
                    }

                    // 5. End trial after feedback period
                    setTimeout(() => {
                        jsPsych.finishTrial({
                            rt: rt,
                            stopwatch_time: stopwatch_time,
                            is_perfect: is_perfect,
                            stopwatch_completed: true,
                            score: score_at_start_of_trial,
                            new_score: score
                        });
                    }, 3000);
                };

                // Setup listeners
                button.onclick = () => handleResponse(performance.now() - startTime);
                const keyboardListener = (e) => {
                    if (e.key === ' ') {
                        e.preventDefault();
                        handleResponse(performance.now() - startTime);
                    }
                };
                document.addEventListener('keydown', keyboardListener);

                // Add cleanup to cancel listeners if trial times out
                jsPsych.currentTrial().cleanup = () => {
                     clearInterval(stopwatchInterval);
                     document.removeEventListener('keydown', keyboardListener);
                };
            },
            on_finish: function(data) {
                // Cleanup listeners from on_load
                if(jsPsych.currentTrial().cleanup){
                    jsPsych.currentTrial().cleanup();
                }
                // If trial timed out (rt is null), record it as a miss
                if (data.rt == null) {
                    data.stopwatch_time = null;
                    data.is_perfect = false;
                    data.stopwatch_completed = false;
                    data.score = score;
                    data.new_score = score;
                }
            }
        };

        stopwatchTrials.push(trial);
    }
    return { timeline: stopwatchTrials };
}

const instructions_1 = `<div class="instructions" style="text-align: left; max-width: 600px; margin: auto;"><h2>Stopwatch Game</h2><p>Welcome to the Stopwatch Game!</p><p>A timer will appear inside a blue button. Your goal is to click the button or press the <strong>SPACEBAR</strong> when the timer shows <strong>exactly 5.00 seconds</strong>.</p><p>In the top-right corner, a scoreboard will track how many times you respond within 50 milliseconds of 5.00s (i.e., between 4.95 and 5.05 seconds).</p><p>If you don't respond before the timer reaches 10.00 seconds, it will count as a missed attempt.</p><p>After you respond, the timer will freeze for 3 seconds before the next round begins. You will play this game 15 times.</p><p>Click "Start Game" when you're ready.</p></div>`;
const instructions_2 = `<div class="instructions" style="text-align: left; max-width: 600px; margin: auto;"><h2>Stopwatch Game - Round 2</h2><p>Welcome to another round of the Stopwatch Game!</p><p>The rules are the same: click the button or press the <strong>SPACEBAR</strong> when the timer shows <strong>exactly 5.00 seconds</strong>.</p><p>Your scoreboard will reset to 0 for this new round.</p><p>This time, the top 10 players who get the most "perfect" hits will receive a monetary reward of $10.</p><p>The timer will freeze for 3 seconds after each attempt. You will play this game 15 times.</p><p>Click "Start Game" when you're ready.</p></div>`;



var flowQs = function(shortName, getFullNameFn) { this.type = 'survey-likert'; this.preamble = function() { let fullName = getFullNameFn(); return `<div class='qInfo' style="text-align: left; max-width: 700px; margin: auto;"><p><strong>Thank you for playing ${fullName}!</strong></p><p>During ${fullName}, to what extent did you feel immersed and engaged in what you were doing?</p></div>`; }; this.questions = function() { const fullName = getFullNameFn(); return [ { prompt: `During ${fullName}, how <b>absorbed</b> did you feel in what you were doing?`, name: 'F_absorbed_' + shortName, labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true }, { prompt: `During ${fullName}, how <b>immersed</b> did you feel in what you were doing?`, name: 'F_immersed_' + shortName, labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true }, { prompt: `During ${fullName}, how <b>engaged</b> did you feel in what you were doing?`, name: 'F_engaged_' + shortName, labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true }, { prompt: `During ${fullName}, how <b>engrossed</b> did you feel in what you were doing?`, name: 'F_engrossed_' + shortName, labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true }, ]; }; this.randomize_question_order = false; this.scale_width = 600; this.data = { questionnaire: 'flow', game_short: shortName }; };
var enjoyQs = function(shortName, getFullNameFn) { this.type = 'survey-likert'; this.preamble = function() { let fullName = getFullNameFn(); return `<div class='qInfo' style="text-align: left; max-width: 700px; margin: auto;"><p>Below are a few more questions about ${fullName}.</p><p>These questions ask about <strong>enjoyment</strong>.</p></div>`; }; this.questions = function() { const fullName = getFullNameFn(); return [ { prompt: `How much did you <b>enjoy</b> playing ${fullName}?`, name: 'E_enjoyable_' + shortName, labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true }, { prompt: `How much did you <b>like</b> playing ${fullName}?`, name: 'E_like_' + shortName, labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true }, { prompt: `How much did you <b>dislike</b> playing ${fullName}?`, name: 'E_dislike_' + shortName, labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true }, { prompt: `How much <b>fun</b> did you have playing ${fullName}?`, name: 'E_fun_' + shortName, labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true }, { prompt: `How <b>entertaining</b> was ${fullName}?`, name: 'E_entertaining_' + shortName, labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true }, ]; }; this.randomize_question_order = false; this.scale_width = 600; this.data = { questionnaire: 'enjoyment', game_short: shortName }; };
function createFreePlaySection() {
    // --- State variables for the free play section ---
    let freePlayState = {
        startTime: null,
        duration: 5 * 60 * 1000, // 5 minutes in milliseconds
        currentGame: 'stopwatch', // Start with stopwatch
        score: 0,
        isFeedbackActive: false
    };
    let sessionTimerInterval = null;

    // Stopwatch game constants
    const TARGET_TIME = 5;
    const PERFECT_WINDOW = 0.050;

    // --- Part 1: Persistent UI Setup (Score removed from top bar) ---
    const startFreePlayUI = {
        type: 'html-keyboard-response',
        stimulus: '',
        trial_duration: 0,
        on_start: function() {
            const ui_container = document.createElement('div');
            ui_container.id = 'free-play-ui-container';
            ui_container.style.position = 'fixed';
            ui_container.style.top = '10px';
            ui_container.style.left = '50%';
            ui_container.style.transform = 'translateX(-50%)';
            ui_container.style.zIndex = '1000';
            ui_container.style.display = 'flex';
            ui_container.style.flexDirection = 'row';
            ui_container.style.alignItems = 'center';
            ui_container.style.gap = '20px';
            ui_container.style.padding = '10px';
            ui_container.style.backgroundColor = 'rgba(240, 240, 240, 0.9)';
            ui_container.style.borderRadius = '10px';
            ui_container.style.fontFamily = 'sans-serif';
            ui_container.style.width = '320px';
            ui_container.style.justifyContent = 'center';


            const timer_div = document.createElement('div');
            timer_div.id = 'free-play-timer';
            timer_div.style.fontWeight = 'bold';
            timer_div.style.color = 'black';
            timer_div.style.fontSize = '18px';

            const switch_btn = document.createElement('button');
            switch_btn.id = 'free-play-switch-btn';
            switch_btn.className = 'jspsych-btn';
            switch_btn.style.width = '180px';
            
            ui_container.appendChild(timer_div);
            ui_container.appendChild(switch_btn);
            document.body.appendChild(ui_container);

            switch_btn.addEventListener('click', () => {
                freePlayState.isFeedbackActive = false; 
                freePlayState.currentGame = freePlayState.currentGame === 'stopwatch' ? 'quiz' : 'stopwatch';
                jsPsych.finishTrial(); 
            });

            const updateUIText = () => {
                const elapsed = Date.now() - freePlayState.startTime;
                const remaining = Math.max(0, freePlayState.duration - elapsed);
                const minutes = Math.floor(remaining / 1000 / 60);
                const seconds = Math.floor((remaining / 1000) % 60);
                
                const timerEl = document.getElementById('free-play-timer');
                const switchEl = document.getElementById('free-play-switch-btn');
                
                if (timerEl) timerEl.innerHTML = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                if (switchEl) switchEl.innerHTML = `Switch to ${freePlayState.currentGame === 'stopwatch' ? 'Quiz' : 'Stopwatch'}`;
            };

            updateUIText();
            sessionTimerInterval = setInterval(updateUIText, 250);
        }
    };
    
    const freePlayIntro = {
        type: 'html-button-response',
        stimulus: `<div style="text-align: left; max-width: 600px; margin: auto;"><h2>Free Play Session</h2><p>This session will last for 5 minutes. You can switch between the Stopwatch Game and a Quiz Game at any time using the control panel that will appear at the top of the screen.</p><p>In the Stopwatch Game, you can click the button or press the <strong>SPACEBAR</strong>.</p></div>`,
        choices: ['Start Free Play'],
        button_html: '<button class="jspsych-btn" style="font-size: 20px; padding: 15px 30px;">%choice%</button>',
        on_finish: function() {
            freePlayState.startTime = Date.now();
        }
    };

    // --- Part 2: The Main Game Loop (Score added to stopwatch HTML) ---
    const freePlayLoop = {
        timeline: [{
            type: 'html-keyboard-response',
            stimulus: function() {
                if (freePlayState.currentGame === 'stopwatch') {
                    return `
                        <div style="position: relative; width: 400px; margin: auto;">
                            <div id="stopwatch-score" style="position: absolute; top: -40px; right: 0; background-color: rgba(0,0,0,0.3); color: white; padding: 5px 15px; border-radius: 15px; font-size: 24px; font-family: sans-serif; transition: background-color 0.2s, color 0.2s;">
                                ${freePlayState.score}
                            </div>
                            <button id="stopwatch-btn" class="jspsych-btn" style="background-color: blue; color: white; width: 400px; height: 200px; border-radius: 10px; display: flex; justify-content: center; align-items: center; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                                <div id="stopwatch-display" style="font-size: 60px; font-family: monospace; font-weight: bold; line-height: 1;">0.00</div>
                            </button>
                        </div>
                    `;
                } else { // 'quiz'
                    const q = jsPsych.randomization.sampleWithoutReplacement(quizQuestions, 1)[0];
                    jsPsych.currentTrial().quiz_data = q; 
                    let quiz_html = `<div id="quiz-container" style="width:100%; max-width: 500px; margin: auto; text-align: center;">`;
                    quiz_html += `<p style="font-size: 20px; margin-bottom: 20px; min-height: 60px; display: flex; align-items: center; justify-content: center;">${q.question}</p>`;
                    quiz_html += `<div id="quiz-options">`;
                    q.options.forEach((option, index) => {
                        quiz_html += `<button class="jspsych-btn quiz-option" data-index="${index}" style="display: block; width: 100%; margin: 10px auto; padding: 15px; font-size: 16px;">${option}</button>`;
                    });
                    quiz_html += `</div>`;
                    quiz_html += `<div id="quiz-feedback-placeholder" style="height: 80px; margin-top: 20px;"></div>`;
                    quiz_html += `</div>`;
                    return quiz_html;
                }
            },
            choices: jsPsych.NO_KEYS,
            on_load: function() {
                if (freePlayState.currentGame === 'stopwatch') {
                    setupStopwatchGame();
                } else {
                    setupQuizGame(jsPsych.currentTrial().quiz_data);
                }
            }
        }],
        loop_function: () => (Date.now() - freePlayState.startTime) < freePlayState.duration
    };

    // --- Part 3: Manual Game Logic Handlers (Feedback screen fixed) ---

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
                button.disabled = true; // --- CHANGE: Disable button on response
            }
            freePlayState.isFeedbackActive = true;

            const is_perfect = elapsedTime !== null && Math.abs(elapsedTime - TARGET_TIME) <= PERFECT_WINDOW;
            
            jsPsych.data.write({
                task: 'free_play_stopwatch',
                stopwatch_time: elapsedTime,
                is_perfect: is_perfect,
                new_score: is_perfect ? freePlayState.score + 1 : freePlayState.score
            });

            // --- CHANGE: Update display to final time instead of showing new screen
            if (display && elapsedTime !== null) {
                display.innerHTML = elapsedTime.toFixed(2);
            } else if (display) {
                display.innerHTML = "Missed!";
                display.style.fontSize = "48px";
            }
            
            if (is_perfect) {
                freePlayState.score++;
                setTimeout(() => {
                    const scoreboardEl = document.getElementById('stopwatch-score'); // Target correct ID
                    if (scoreboardEl) {
                        scoreboardEl.style.backgroundColor = '#ffc107';
                        scoreboardEl.style.color = 'black';
                        scoreboardEl.textContent = freePlayState.score; // Update to new score
                        setTimeout(() => {
                           scoreboardEl.style.backgroundColor = 'rgba(0,0,0,0.3)';
                           scoreboardEl.style.color = 'white';
                        }, 250);
                    }
                }, 1500);
            }
            
            setTimeout(() => {
                if (freePlayState.isFeedbackActive) {
                    freePlayState.isFeedbackActive = false; 
                    jsPsych.finishTrial();
                }
            }, 3000);
        };

        button.onclick = () => {
            let elapsed = (performance.now() - stopwatchStartTime) / 1000;
            handleStopwatchEnd(elapsed);
        };
        const spacebarListener = (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                let elapsed = (performance.now() - stopwatchStartTime) / 1000;
                handleStopwatchEnd(elapsed);
            }
        };
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
                feedback_placeholder.innerHTML = `<h3 style="color: ${is_correct ? 'green' : 'red'};">${is_correct ? '✓ Correct!' : '✗ Incorrect'}</h3>
                                          <button id="feedback-next-btn" class="jspsych-btn">Next</button>`;
                document.getElementById('feedback-next-btn').onclick = () => jsPsych.finishTrial();
            };
        });
    }

    // --- Part 4: Cleanup ---
    const endFreePlayUI = {
        type: 'html-keyboard-response',
        stimulus: '',
        trial_duration: 0,
        on_start: function() {
            clearInterval(sessionTimerInterval);
            const ui_container = document.getElementById('free-play-ui-container');
            if (ui_container) { ui_container.remove(); }
        }
    };
    const freePlayEnd = {
        type: 'html-button-response',
        stimulus: `<div style="text-align: center; max-width: 600px; margin: auto;"><h2>Free Play Session Complete!</h2><p>The 5-minute free play session has ended.</p></div>`,
        choices: ['Continue'],
    };

    return { 
        timeline: [ freePlayIntro, startFreePlayUI, freePlayLoop, endFreePlayUI, freePlayEnd ] 
    };
}
var timeline = [];

timeline.push({ type: "external-html", url: "./html/consent.html", cont_btn: "advance" });
timeline.push({ type: "instructions", pages: [`<div style="text-align: left; max-width: 800px; margin: auto;"><h2>Welcome to the Experiment!</h2><p>In this study, you will be helping us understand what makes games engaging.</p><p>The entire experiment will take about 10-15 minutes.</p><p>Click 'Next' to begin!</p></div>`], show_clickable_nav: true });
timeline.push(createStopwatchTask(2, "stopwatch_1", instructions_1));
//timeline.push({ timeline: [ new flowQs('stopwatch1', () => 'the Stopwatch Game'), new enjoyQs('stopwatch1', () => 'the Stopwatch Game') ] });
timeline.push(createStopwatchTask(2, "stopwatch_2", instructions_2));
timeline.push(createFreePlaySection());
timeline.push({ type: 'survey-text', questions: [ {prompt: "Please enter your age:", name: "age", required: true}, {prompt: "Please enter your gender:", name: "gender", required: true}, {prompt: "Do you have any comments about the experiment? (Optional)", name: "comments", rows: 4, columns: 50} ] });
timeline.push({ type: 'html-button-response', stimulus: `<h2>Experiment Complete!</h2><p>Thank you for your participation.</p><p>Your completion code is: <strong>${prolific_completion_code}</strong></p><p>Please copy this code and paste it into Prolific to receive credit.</p>`, choices: ['Finish'] });


jsPsych.init({
    timeline: timeline,
    on_finish: function() {
        jsPsych.data.addProperties({ completion_code: prolific_completion_code });
        fetch("https://pipe.jspsych.org/api/data/", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "*/*" },
            body: JSON.stringify({
              experimentID: experiment_id,
              filename: myfilename,
              data: jsPsych.data.get().csv(),
            }),
        });
        document.body.innerHTML = `<div align='center' style="margin: 10%"><p>Thank you!</p><p>Please wait to be redirected to Prolific.</p></div>`;
        setTimeout(() => { location.href = `https://app.prolific.co/submissions/complete?cc=${prolific_completion_code}`; }, 3000);
    }
});