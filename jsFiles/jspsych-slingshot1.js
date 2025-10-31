/**
 * jspsych-canvas-keyboard-response
 * Chris Jungerius (modified from Josh de Leeuw)
 *
 * a jsPsych plugin for displaying a canvas stimulus and getting a keyboard response
 *
 * documentation: docs.jspsych.org
 *
 **/


jsPsych.plugins["slingshot1-game"] = (function () {

  var plugin = {};

  plugin.info = {
    name: 'slingshot1-game',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.FUNCTION,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The drawing function to apply to the canvas. Should take the canvas object as argument.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the stimulus.'
      },
      total_shots: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Number of shots',
        default: null,
        description: 'Number of shots before the game ends.'
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'How long to show trial before it ends.'
      },
      canvas_size: {
        type: jsPsych.plugins.parameterType.INT,
        array: true,
        pretty_name: 'Canvas size',
        default: [500, 500],
        description: 'Array containing the height (first value) and width (second value) of the canvas element.'
      },
      ball_color: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Color of the ball',
        default: 'blue',
        description: 'Color of the ball in the slingshot1 game.'
      },
      ball_xPos: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Ball position on x axis',
        default: .15,
        description: 'Ball position on x axis in terms of percent from left.'
      },
      ball_yPos: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Ball position on y axis',
        default: .5,
        description: 'Ball position on y axis in terms of percent from top.'
      },
      ball_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Size of the ball',
        default: 10,
        description: 'Radius of the ball in pixels.'
      },
      target_color: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Color of the target',
        default: 'red',
        description: 'Color of the target in the slingshot1 game.'
      },
      target_color_hit: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Color of the target',
        default: 'green',
        description: 'Color of the target in the slingshot1 game.'
      },
      target_xPos: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Target position on x axis',
        default: .8,
        description: 'Target position on x axis in terms of percent from left.'
      },
      target_yPos: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Target position on y axis',
        default: .2,
        description: 'Target position on y axis in terms of percent from top.'
      },
      target_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Target size',
        default: 20,
        description: 'Target length and width in pixels.'
      },
      game_type: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Game type',
        default: 1,
        description: 'Streak (game_type = 1) or non-streak (game_type = 0).'
      },
      friction: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Air friction',
        default: .02,
        description: 'Amont of drag applies to ball as it flies.'
      },
      tension: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Spring tension',
        default: .03,
        description: 'Stiffness of the spring.'
      },
    }
  }

  plugin.trial = function (display_element, trial) {

    var new_html = '<div id="jspsych-canvas-keyboard-response-stimulus">' + '<canvas id="jspsych-canvas-stimulus" height="' + trial.canvas_size[0] + '" width="' + trial.canvas_size[1] + '"></canvas>' + '<div id="my_mm" style="height:100mm;display:none"></div>' + '</div>';
    
    // add prompt
    if (trial.prompt !== null) {
      new_html = trial.prompt + new_html;
    }

    // draw
    display_element.innerHTML = new_html;
    let c = document.getElementById("jspsych-canvas-stimulus");
    let mmPerPx = $('#my_mm').height()/100;
    console.log(mmPerPx);
    trial.stimulus(c, trial, mmPerPx)

    // function to end trial when it is time
    var end_trial = function () {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // stop listening for last trial
      clearInterval(listenForLastTrial);

      // kill keyboard listeners
      if (typeof keyboardListener !== 'undefined') {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      // gather the data to store for the trial
      var trial_data = {
        "totalTrials": slingshot1.data.totalTrials,
        "totalScore": slingshot1.data.totalHits,
        "outcomes": slingshot1.data.outcome,
        "xLocBall": slingshot1.data.ballX,
        "yLocBall": slingshot1.data.ballY,
        "yLocTarget": slingshot1.data.targetLoc,
        "distance": slingshot1.data.dist,
        "minDistance": slingshot1.data.minDist,
        "minDistanceMM": slingshot1.data.minDistMM
      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // listen for last trial of slingshot1 game
    var listenForLastTrial = setInterval(function () { if (slingshot1.data.totalTrials == trial.total_shots) end_trial() }, 200)

    // end trial if trial_duration is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function () {
        end_trial();
      }, trial.trial_duration);
    }

  };

  return plugin;

})();
