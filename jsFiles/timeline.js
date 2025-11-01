var filename_prefix = jsPsych.data.getURLVariable('PROLIFIC_PID');
if (!filename_prefix) { filename_prefix = jsPsych.randomization.randomID(10) };
var myfilename = filename_prefix + "_combined.csv";

var experiment_id = "ZPk39lIbYVWL";
var prolific_completion_code = "CGHVX8IL";

var condition_assignment;
const rand_num = Math.random();

const saveSurveyData = (data) => {
    const responses = JSON.parse(data.responses);
    for (const [key, value] of Object.entries(responses)) {
        data[key] = value;
    };
};

if (rand_num < 0.33333) {
    condition_assignment = 1; // Intrinsic motivation
} else if (rand_num < 0.66666) {
    condition_assignment = 2; // Competitive - Average
} else {
    condition_assignment = 3; // Competitive - Count
}



console.log("Condition:", condition_assignment);

jsPsych.data.addProperties({
    subject: filename_prefix,
    condition: condition_assignment,
});

// --- DYNAMIC TEXT STRINGS ---
let moneyMessage2 = condition_assignment == 1 ? '' : ' Your performance here also will not influence your chances of winning a bonus.'
let moneyMessage1 = condition_assignment == 1 ? '' : ' However, you will not earn tokens during the free play session; your performance during the free play session will not influence your chances of winning a bonus.'
let moneyMessage0 = condition_assignment == 1 ? '' : '<p><strong>You will not earn tokens during the free play session; your performance during the free play session will not influence your chances of winning a bonus.</strong></p>'

let correct_response, your_goal;

if (condition_assignment === 3) {
    correct_response = "Stop the timer between 4.80 and 5.20 seconds";
    your_goal = `Your goal is to <strong>stop the timer between 4.80 and 5.20 seconds</strong>`
} else {
    correct_response = "Stop the timer as close to 5.00 seconds as possible";
    your_goal = `Your goal is to <strong>stop the timer as close to 5.00 seconds as possible</strong>`
}

const stopwatch_base_instructions = `<div class="instructions" style="text-align: left; max-width: 600px; margin: auto;"><h2>Game #2: Stopwatch Game</h2>`;

let condition_specific_paragraph = '';
switch (condition_assignment) {
    case 1:
        condition_specific_paragraph = `<div style="font-size:20px"><p>Your goal is to stop the timer as close to 5.00 seconds as possible on each turn. Good luck!</p>`;
        break;
    case 2:
        condition_specific_paragraph = `<div style="font-size:20px; width:700px"><p>There is a $100 bonus opportunity!</p>
        <p>Throughout the Stopwatch Game, you'll earn tokens for good performance. <strong>Your tokens will be entered into a lottery, and if one of your tokens is drawn, you'll earn $100</strong>. To maximize your chances of winning $100, win as many tokens as possible!</p>
        <p>The closer you stop the timer to 5.00s, the more tokens you'll earn. Specifically, <strong>each time you stop the timer, you'll earn 1.20 tokens minus your distance from 5.00s</strong>. For example:</p>
        <ul>
            <li>If you stop the timer at 5.00s, you'll earn the full 1.20 tokens.</li>
            <li>If you stop the timer 0.01s too early or late, you'll earn 1.19 tokens.</li>
            <li>If you stop the timer 0.05s too early or late, you'll earn 1.15 tokens.</li>
            <li>If you stop the timer 0.10s too early or late, you'll earn 1.10 tokens.</li>
            <li>If you stop the timer 0.20s too early or late, you'll earn 1.00 tokens.</li>
        </ul>
        <p>To maximize your chances of winning $100, <strong>you must stop the timer as close to 5.00s as possible</strong>.</p>`;
        break;
    case 3:
        condition_specific_paragraph = `<div style="font-size:20px; width:700px"><p>There is a $100 bonus opportunity!</p>
        <p>Throughout the Stopwatch Game, you'll earn tokens for good performance. <strong>Your tokens will be entered into a lottery, and if one of your tokens is drawn, you'll earn $100</strong>. To maximize your chances of winning $100, win as many tokens as possible!</p>
        <p>You'll earn tokens each time you stop the timer between 4.80s and 5.20s. Specifically, <strong>each time you stop the timer between 4.80s and 5.20s, you'll earn 4 tokens</strong>.</p>
        <p>To maximize your chances of winning $100, <strong>you must stop the timer between 4.80s and 5.20s</strong>.</p>`;
        break;
}

let final_reminder_text = '';
switch (condition_assignment) {
    case 1:
        final_reminder_text = `<div class="instructions" style="text-align: left; font-size: 20px; max-width: 650px; margin: auto;">
        <p>Next, you will play the Stopwatch Game.</p>
        <p>As a final reminder, your goal is to <strong>stop the timer as close to 5.00 seconds</strong> as possible.</p></div>`;
        break;
    case 2:
        final_reminder_text = `<div class="instructions" style="text-align: left; font-size: 20px; max-width: 650px; margin: auto;">
        <p>Next, you will play the Stopwatch Game.</p>
        <p>As a final reminder, the closer you stop the timer to 5.00s, the more tokens you'll earn. Specifically, <strong>each time you stop the timer, you'll earn 1.20 tokens minus your distance from 5.00s</strong>.</p></div>`;
        break;
    case 3:
        final_reminder_text = `<div class="instructions" style="text-align: left; font-size: 20px; max-width: 650px; margin: auto;">
        <p>Next, you will play the Stopwatch Game.</p>
        <p>As a final reminder, you'll earn tokens each time you stop the timer between 4.80s and 5.20s. Specifically, <strong>each time you stop the timer between 4.80s and 5.20s, you'll earn 4 tokens</strong>.</p></div>`;
        break;
}

const stopwatch_instructions_html = stopwatch_base_instructions + condition_specific_paragraph + `<p>You will play 20 rounds of the Stopwatch Game.</p></div></div>`;

// --- TASK AND QUESTIONNAIRE DEFINITIONS ---

function createStopwatchTask(repetitions = 5, taskName = "stopwatch") {
    let stopwatchTrials = [];
    let score = 0;
    const TARGET_TIME = 5;
    const PERFECT_WINDOW = 0.050;

    for (let i = 0; i < repetitions; i++) {
        const stopwatch_trial = {
            type: 'html-keyboard-response',
            choices: jsPsych.NO_KEYS,
            stimulus: function() {
                return `
                    <div style="position: relative; width: 400px; margin: auto;">
                    </div>
                    <button id="stopwatch-task-btn" class="jspsych-btn" style="background-color: blue; color: white; width: 400px; height: 200px; border-radius: 10px; display: flex; justify-content: center; align-items: center; box-shadow: 0 5px 15px rgba(0,0,0,0.2); border: none; outline: none;">
                        <div id="stopwatch-display" style="font-size: 60px; font-family: monospace; font-weight: bold; line-height: 1;">0.00</div>
                    </button>`;
            },
            data: { task: taskName, trial_index: i, target_time: TARGET_TIME },
            on_load: function() {
                const startTime = performance.now();
                const display = document.getElementById('stopwatch-display');
                const button = document.getElementById('stopwatch-task-btn');
                let trialEnded = false; 

                let stopwatchInterval = setInterval(function() {
                    let elapsed = (performance.now() - startTime) / 1000;
                    if (elapsed <= 10 && display && !trialEnded) {
                        display.innerHTML = elapsed.toFixed(2);
                    } else {
                        clearInterval(stopwatchInterval);
                    }
                }, 10);

                const handleStopwatchEnd = (rt) => {
                    if (trialEnded) return; 
                    trialEnded = true;

                    clearTimeout(trialTimeout);
                    clearInterval(stopwatchInterval);
                    document.removeEventListener('keydown', keyboardListener);
                    if (button) {
                        button.onclick = null;
                        button.disabled = true;
                    }
                    
                    const score_at_start_of_trial = score;
                    const stopwatch_completed = rt !== null;
                    let stopwatch_time = null;
                    let is_perfect = false;
                    let new_score = score;

                    if (stopwatch_completed) {
                        const clickTime = rt / 1000;
                        stopwatch_time = parseFloat(clickTime.toFixed(2));
                        is_perfect = Math.abs(parseFloat(clickTime.toFixed(2)) - TARGET_TIME) <= PERFECT_WINDOW;
                        if(display) display.innerHTML = stopwatch_time.toFixed(2);
                    } else {
                        if(display) {
                            display.innerHTML = "Time Out!";
                            display.style.fontSize = "48px";
                        }
                    }

                    if (is_perfect) {
                        score++;
                        new_score = score;
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
                
                const trialTimeout = setTimeout(() => handleStopwatchEnd(null), 10000);
                const keyboardListener = (e) => { if (e.key === ' ') { e.preventDefault(); handleStopwatchEnd(performance.now() - startTime); } };
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

    const freePlayLoop = {
        timeline: [{
            type: 'html-keyboard-response',
            stimulus: function() {
                if (!freePlayState.startTime) {
                    freePlayState.startTime = Date.now();
                    freePlayState.timerInterval = setInterval(() => {
                        const timerEl = document.getElementById('free-play-timer');
                        if (timerEl) {
                            const elapsed = Date.now() - freePlayState.startTime;
                            const remaining = Math.max(0, freePlayState.duration - elapsed);
                            const minutes = Math.floor(remaining / 1000 / 60);
                            const seconds = Math.floor((remaining / 1000) % 60);
                            timerEl.innerHTML = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                        }
                    }, 250);
                    freePlayState.masterTimeout = setTimeout(() => {
                        if (holeInOne && holeInOne.stop) {
                            holeInOne.stop();
                        }
                        jsPsych.finishTrial({ free_play_timeout: true });
                    }, freePlayState.duration);
                }

                const timer_text = `Time Remaining: ${Math.floor(Math.max(0, freePlayState.duration - (Date.now() - freePlayState.startTime)) / 1000 / 60)}:${Math.floor((Math.max(0, freePlayState.duration - (Date.now() - freePlayState.startTime)) / 1000) % 60).toString().padStart(2, '0')}`;
                const switch_button_text = `Switch to ${freePlayState.currentGame === 'stopwatch' ? 'Hole in One' : 'Stopwatch'}`;

                const ui_html = `<div id="free-play-ui-container" style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 20px; padding: 10px; font-family: sans-serif; width: 320px; margin: auto; border: 1px solid #ccc; border-radius: 10px;"><div id="free-play-timer" style="font-weight: bold; color: black; font-size: 18px; width: 180px; text-align: left;"">${timer_text}</div><button id="free-play-switch-btn" class="jspsych-btn" style="width: 180px;">${switch_button_text}</button></div>`;

                let game_html = '';
                if (freePlayState.currentGame === 'stopwatch') {
                    game_html = `<div style="position: relative; width: 400px; margin: auto;"><button id="stopwatch-btn" class="jspsych-btn" style="background-color: blue; color: white; width: 400px; height: 200px; border-radius: 10px; display: flex; justify-content: center; align-items: center; box-shadow: 0 5px 15px rgba(0,0,0,0.2);"><div id="stopwatch-display" style="font-size: 60px; font-family: monospace; font-weight: bold; line-height: 1;">0.00</div></button></div>`;
                } else {
                    // ** DISTORTION FIX **: Wrap the canvas in a container with the correct dimensions to prevent CSS squashing it.

                    game_html = `<div id="hole-in-one-viewport" style="width: 900px; height: 475px; margin: 0 auto; border: 1px solid #ccc;"><canvas id="hole-in-one-canvas-freeplay" style="width: 100%; height: 100%;"></canvas></div>`;
                }
                
                return `${ui_html}<div id="game-area-container" style="padding-top: 50px;">${game_html}</div>`;
            },
            choices: jsPsych.NO_KEYS,
            on_load: function() {
                document.getElementById('free-play-switch-btn').addEventListener('click', () => {
                    freePlayState.isFeedbackActive = false;
                    freePlayState.currentGame = freePlayState.currentGame === 'stopwatch' ? 'hole_in_one' : 'stopwatch';
                    jsPsych.finishTrial();
                });

                if (freePlayState.currentGame === 'stopwatch') {
                    setupStopwatchGame();
                } else {
                    setupHoleInOneGame();
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
                if (elapsed <= 10) { display.innerHTML = elapsed.toFixed(2); } else { handleStopwatchEnd(null); }
            } else { clearInterval(stopwatchInterval); }
        }, 10);
        const handleStopwatchEnd = (elapsedTime) => {
            clearInterval(stopwatchInterval);
            document.removeEventListener('keydown', spacebarListener);
            if (button) { button.onclick = null; button.disabled = true; }
            freePlayState.isFeedbackActive = true;
            const is_perfect = elapsedTime !== null && Math.abs(parseFloat(elapsedTime.toFixed(2)) - TARGET_TIME) <= PERFECT_WINDOW;
            jsPsych.data.write({ task: 'free_play_stopwatch', stopwatch_time: elapsedTime, is_perfect: is_perfect, new_score: is_perfect ? freePlayState.score + 1 : freePlayState.score, target_time: TARGET_TIME});
            if (display && elapsedTime !== null) { display.innerHTML = elapsedTime.toFixed(2); } else if (display) { display.innerHTML = "Time Out!"; display.style.fontSize = "48px"; }
            if (is_perfect) {
                freePlayState.score++;
                setTimeout(() => {
                    const scoreboardEl = document.getElementById('stopwatch-score');
                    if (scoreboardEl) { scoreboardEl.style.backgroundColor = '#ffc107'; scoreboardEl.style.color = 'black'; scoreboardEl.textContent = freePlayState.score; setTimeout(() => { scoreboardEl.style.backgroundColor = 'rgba(0,0,0,0.3)'; scoreboardEl.style.color = 'white'; }, 250); }
                }, 1500);
            }
            setTimeout(() => { if (freePlayState.isFeedbackActive) { freePlayState.isFeedbackActive = false; jsPsych.finishTrial(); } }, 3000);
        };
        const spacebarListener = (e) => { if (e.key === ' ') { e.preventDefault(); handleStopwatchEnd((performance.now() - stopwatchStartTime) / 1000); } };
        document.addEventListener('keydown', spacebarListener);
    }

    function setupHoleInOneGame() {
        // ** BROKEN MECHANISM FIX **: This block completely resets the physics engine state.
        if (holeInOne && holeInOne.engine) {
            // 1. Remove all lingering event listeners from previous game instances. This is the most critical step.
            Matter.Events.off(holeInOne.engine);
            // 2. Clear all physical bodies from the world.
            Matter.World.clear(holeInOne.engine.world);
            // 3. Clear the engine itself.
            Matter.Engine.clear(holeInOne.engine);
        }
        // Also reset the game's internal data for a clean start
        if (holeInOne && holeInOne.data) {
            holeInOne.data.totalTrials = 0;
            holeInOne.data.totalScore = 0;
        }

        const canvas = document.getElementById('hole-in-one-canvas-freeplay');
        const game_params = {
            canvas_size: [900, 475], ball_color: 'white', ball_size: 10,
            ball_xPos: .13, ball_yPos: .5, wall_width: 75, wall_color: '#797D7F',
            wall_xPos: .9, hole_size: 75, friction: .02, tension: .03
        };

        canvas.width = game_params.canvas_size[0];
        canvas.height = game_params.canvas_size[1];
        
        jsPsych.data.write({ task: 'free_play_hole_in_one_start' });
        holeInOne.run(canvas, game_params);
    }

    const freePlayEnd = {
        type: 'html-button-response',
        stimulus: `<div style="text-align: center; max-width: 600px; margin: auto;"><h2>Free Play Session Complete!</h2><p>The 5-minute free play session has ended.</p></div>`,
        choices: ['Continue'],
        on_load: function() { 
            if (freePlayState.timerInterval) clearInterval(freePlayState.timerInterval); 
            if (freePlayState.masterTimeout) clearTimeout(freePlayState.masterTimeout);
        }
    };

    return { timeline: [freePlayLoop, freePlayEnd] };
}
var flowQs = function(shortName, getFullNameFn) {
    this.type = 'survey-likert';
    this.preamble = () => `<div class='qInfo' style="text-align: left; max-width: 700px; margin: auto;"><p>During ${getFullNameFn()}, to what extent did you feel immersed and engaged in what you were doing? Please answer the following questions as honestly and accurately as possible.</p></div>`;
    this.questions = () => [
            { prompt: `During ${getFullNameFn()}, how <b>absorbed</b> did you feel in what you were doing?`, name: 'absorbed', labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true },
            { prompt: `During ${getFullNameFn()}, how <b>immersed</b> did you feel in what you were doing?`, name: 'immersed', labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true },
            { prompt: `During ${getFullNameFn()}, how <b>engaged</b> did you feel in what you were doing?`, name: 'engaged', labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true },
            { prompt: `During ${getFullNameFn()}, how <b>engrossed</b> did you feel in what you were doing?`, name: 'engrossed', labels: ['0<br>A little', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Completely'], required: true },
        ];
    this.randomize_question_order = false; this.scale_width = 600; this.data = { questionnaire: 'flow', game_short: shortName }; this.on_finish = saveSurveyData;
};

var enjoyQs = function(shortName, getFullNameFn) {
    this.type = 'survey-likert';
    this.preamble = () => `<div class='qInfo' style="text-align: left; max-width: 700px; margin: auto;"><p>Instead of just being immersed, during ${getFullNameFn()}, to what extent did you like or enjoy what you were doing? Please answer the following questions as honestly and accurately as possible.</p></div>`;
    this.questions = () => [
            { prompt: `How much did you <b>enjoy</b> playing ${getFullNameFn()}?`, name: 'enjoyable', labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true },
            { prompt: `How much did you <b>like</b> playing ${getFullNameFn()}?`, name: 'like', labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true },
            { prompt: `How much did you <b>dislike</b> playing ${getFullNameFn()}?`, name: 'dislike', labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true },
            { prompt: `How much <b>fun</b> did you have playing ${getFullNameFn()}?`, name: 'fun', labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true },
            { prompt: `How <b>entertaining</b> was ${getFullNameFn()}?`, name: 'entertaining', labels: ['0<br>Not at all', '1', '2', '3', '4<br>Moderately', '5', '6', '7', '8<br>Extremely'], required: true },
        ];
    this.randomize_question_order = false; this.scale_width = 600; this.data = { questionnaire: 'enjoyment', game_short: shortName }; this.on_finish = saveSurveyData;
};

var scbQs = function(shortName, getFullNameFn) {
    this.type = 'survey-likert';
    this.preamble = () => `<div class='qInfo' style="text-align: left; max-width: 700px; margin: auto;"><p>Next, we're interested in how <strong>difficult</strong> you found ${getFullNameFn()}. Please answer the following question as honestly and accurately as possible.</p></div>`;
    this.questions = () => [
            { prompt: `How difficult did you find ${getFullNameFn()}?`, name: 'scb', labels: ['-4<br>Way too easy', '-3', '-2', '-1', '0<br>Neither too easy nor too hard', '1', '2', '3', '4<br>Way too hard'], required: true },
        ];
    this.randomize_question_order = false; this.scale_width = 600; this.data = { questionnaire: 'enjoyment', game_short: shortName }; this.on_finish = saveSurveyData;
};

const holeInOneTask = {
    type: 'hole-in-one-game',
    stimulus: holeInOne.run, 
    total_shots: 20,
    canvas_size: [475, 900],
    ball_color: 'white', ball_size: 10, ball_xPos: .13, ball_yPos: .5,
    wall_width: 75, wall_color: '#797D7F', wall_xPos: .9,
    hole_size: 75, friction: .02, tension: .03,
    data: { task: 'hole_in_one' },
    prompt: `<div class='instructions'><p><strong>Hole in One</strong>. The goal of Hole in One is to shoot the ball through the hole. Follow the instructions in the game area.</p></div>`,
    on_start: function() {
        // ** BROKEN MECHANISM FIX **: This block ensures the first game starts fresh.
        if (holeInOne && holeInOne.engine) {
            Matter.Events.off(holeInOne.engine);
            Matter.World.clear(holeInOne.engine.world);
            Matter.Engine.clear(holeInOne.engine);
        }
        if (holeInOne && holeInOne.data) {
            holeInOne.data.totalTrials = 0;
            holeInOne.data.totalScore = 0;
        }
    }
};

const stopwatch_attention_check_1 = {
    type: 'survey-multi-choice',
    questions: [{ prompt: "What is your goal?", name: "stopwatch_check_1",  options: [
                "Stop the timer as close to 5.00 seconds as possible",
                "Stop the timer between 4.80 and 5.20 seconds",
                "Stop the timer as fast as possible",
                "Stop the timer before 10 seconds",
            ], required: true }],
    on_finish: function(data) { data.correct =(JSON.parse(data.responses).stopwatch_check_1 === correct_response); }
};

const attention_check_1_feedback = {
    type: 'html-button-response',
    stimulus: () => (jsPsych.data.get().last(1).values()[0].correct) ? `<div style="max-width: 600px; margin: auto;"><p style="font-size: 24px; color: green;">Correct!</p><p>The correct answer was: <p><strong>${correct_response}</strong>.</p></p></div>` : `<div style="max-width: 600px; margin: auto;"><p style="font-size: 24px; color: red;">Incorrect.</p><p>The correct answer was: <p><strong>${correct_response}</strong>.</p></p></div>`,
    choices: ['Continue']
};

const stopwatch_attention_check_2 = {
    type: 'survey-multi-choice',
    questions: [{ prompt: "How can you earn a bonus payment in this game?", name: "stopwatch_check_2", options: (condition_assignment === 2) ? ["By getting the closest average time to 5.00 seconds.", "By getting the most stops between 4.80s and 5.20s.", "By playing for the longest amount of time.", "Everyone gets a bonus payment."] : ["By getting the most stops between 4.80s and 5.20s.", "By getting the closest average time to 5.00 seconds.", "By playing for the longest amount of time.", "Everyone gets a bonus payment."], required: true }],
    on_finish: function(data) { const answer = JSON.parse(data.responses).stopwatch_check_2; let correct_response = (condition_assignment === 2) ? "By getting the closest average time to 5.00 seconds." : "By getting the most stops between 4.80s and 5.20s."; data.correct = (answer === correct_response); }
};

const attention_check_2_feedback = {
    type: 'html-button-response',
    stimulus: function() {
        let correct_answer_text = (condition_assignment === 2) ? "By getting the closest average time to 5.00 seconds." : "By getting the most stops between 4.80s and 5.20s.";
        return (jsPsych.data.get().last(1).values()[0].correct) ? `<div style="max-width: 600px; margin: auto;"><p style="font-size: 24px; color: green;">Correct!</p><p>The correct answer was: <strong>${correct_answer_text}</strong></p></div>` : `<div style="max-width: 600px; margin: auto;"><p style="font-size: 24px; color: red;">Incorrect.</p><p>The correct answer was: <strong>${correct_answer_text}</strong></p></div>`;
    },
    choices: ['Continue']
};

const conditional_attention_check_2 = {
    timeline: [stopwatch_attention_check_2, attention_check_2_feedback],
    conditional_function: () => condition_assignment > 1
};

// =================================================================
//  MAIN TIMELINE
// =================================================================
var timeline = [];

timeline.push({ type: "external-html", url: "./html/consent.html", cont_btn: "advance" });
timeline.push({ type: "instructions", pages: [`<div style="text-align: left; max-width: 800px; margin: auto;"><h2>Welcome!</h2><p>Thank you for participating in our study. In this session, you will play a few short games designed to help us understand what makes them immersive and engaging.</p><p>Please read all instructions carefully. Click 'Next' to begin.</p></div>`], show_clickable_nav: true });

// --- Part 1: Hole in One ---
timeline.push({ type: "instructions", pages: [`<div style="text-align: left; max-width: 600px; margin: auto;"><h2>Game #1: Hole in One</h2><p>The first game is called <strong>Hole in One</strong>.</p><p>After the game, you will be asked to answer a few questions about your experience.</p><p>When you are ready, click "Next" to begin.</p></div>`], show_clickable_nav: true });
timeline.push(holeInOneTask);
timeline.push({ type: 'html-button-response', stimulus: "<p>Hole in One is now complete.</p><p>Please proceed to answer some questions about your experience.</p>", choices: ['Continue'] });
timeline.push(new flowQs('hole_in_one', () => 'Hole in One'));
timeline.push(new enjoyQs('hole_in_one', () => 'Hole in One'));
timeline.push(new scbQs('hole_in_one', () => 'Hole in One'));

//--- Part 2: Stopwatch ---
timeline.push({ type: 'html-button-response', stimulus: "<p>Next, you will play a different game called the Stopwatch Game.</p><p>Continue to learn more about the Stopwatch Game.</p>", choices: ['Continue'] });
const stopwatch_visual_instructions_pages = [
    `<div class='instructions' style="max-width: 800px; margin: auto; text-align: center;">
        <h2>Game #2: Stopwatch Game</h2>
        <p>In this game, a blue timer will appear on your screen.</p>
        <img src="./timer-gif.gif" style="width: 400px;"/>
        <p>When a trial starts, the timer will automatically begin counting up from 0.00 seconds.</p>
     </div>`,

    `<div class='instructions' style="max-width: 800px; margin: auto; text-align: center;">
        <p>When you press your SPACEBAR, the timer will stop.</p>
        <img src="./stopwatchscreenshot.png" style="width: 400px;"/>
        <p style="font-size: 20px; font-weight: bold;">${your_goal}.</p>
    </div>`,

    `<div class='instructions' style="max-width: 800px; margin: auto; text-align: center;">
        <p>If the timer reaches 10 seconds, the trial will time out.</p>
        <p>The game will show "Time Out!" and then move to the next trial.</p>
        <img src="./timeout.png" style="width: 400px;"/>
    </div>`
];
timeline.push({ type: 'instructions', pages: stopwatch_visual_instructions_pages, show_clickable_nav: true, button_label_next: "Continue" });
timeline.push({ type: 'html-button-response', stimulus: stopwatch_instructions_html, choices: ['Continue'] });
timeline.push(stopwatch_attention_check_1);
timeline.push(attention_check_1_feedback);
//timeline.push(conditional_attention_check_2);
timeline.push({ type: 'html-button-response', stimulus: final_reminder_text, choices: ['Start Game'] });
timeline.push(createStopwatchTask(20, "stopwatch_game"));
timeline.push({ type: 'html-button-response', stimulus: "<p>Now please answer some questions about your experience.</p>", choices: ['Continue'] });
timeline.push(new flowQs('stopwatch', () => 'the Stopwatch Game'));
timeline.push(new enjoyQs('stopwatch', () => 'the Stopwatch Game'));
timeline.push(new scbQs('stopwatch', () => 'the Stopwatch Game'));

// --- Part 3: Free Play ---
timeline.push({ type: 'html-button-response', stimulus: `<div style="text-align: left; max-width: 650px; margin: auto;">
    <h2>Part 3: Free Play Session</h2><p>Thank you for finishing both games! Now, you will have a 5-minute "free play" period where you can freely play two games for some more time.</p><p>You will be able to choose which game you want to play, and you can switch between them as often as you like.</p>${moneyMessage0}<p>Click 'Continue' for detailed instructions.</p></div>`, choices: ['Continue'], });
timeline.push({ type: 'html-button-response', stimulus: `<div style="text-align: left; max-width: 600px; margin: auto;"><h2>Free Play Instructions</h2><p>This session will last for 5 minutes.</p><p>You can switch back and forth between two games:</p><ul><li><b>Stopwatch Game:</b> This is the same game as before.${moneyMessage1}</li><li><b>Hole in One Game:</b> This is the same game as before.${moneyMessage2}</li></ul><p>A control panel will appear above the game, allowing you to switch at any time.</p></div>`, choices: ['Start Free Play'] });
timeline.push(createFreePlaySection());

// --- Demographics & End ---
timeline.push({ type: 'survey-text', questions: [{prompt: "Please enter your age:", name: "age", required: true}, {prompt: "Please enter your gender:", name: "gender", required: true}, {prompt: "Do you have any comments about the experiment? (Optional)", name: "comments", rows: 4, columns: 50}] });

/*
timeline.push({ type: 'html-button-response', stimulus: `<h2>Thank you!</h2>
    <p>The survey is now complete.</p>
    <p style="font-size: 24px;"><strong>To receive payment, proceed to the next screen and wait to be redirected to Prolific.</strong></p>`, choices: ['Finish'] });
*/
// --- INITIALIZE & RUN EXPERIMENT ---
jsPsych.init({
    timeline: timeline,
    on_finish: function() {
        jsPsych.data.addProperties({ completion_code: prolific_completion_code });
        fetch("https://pipe.jspsych.org/api/data/", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "*/*" },
            body: JSON.stringify({ experimentID: experiment_id, filename: myfilename, data: jsPsych.data.get().csv(), }),
        });
        document.body.innerHTML = `<div align='center' style="margin: 10%"><p>Thank you!</p><p>Please wait to be redirected to Prolific.</p></div>`;
        setTimeout(() => { location.href = `https://app.prolific.co/submissions/complete?cc=${prolific_completion_code}`; }, 3000);
    }
});