/* 
 *  Hole in One
 *  David E. Melnikoff
 *
 *  A ball-shooting game compatible with jsPsych
 *
 */

var holeInOne = (function () {

	var game = {};

	// import methods from matter.js and define physics engine
	var { Engine, Runner, Render, Vertices, Composite, World, Bodies, Events, Mouse, MouseConstraint } = Matter;
	var engine = Engine.create();
	game.engine = engine;

    // NEW: Keep track of the active runner and renderer to stop them later
    game.runner = null;
    game.render = null;

	// temporary data
	var ballXtrial = [0]; 	// ball's X coordinates on current trial
	var ballYtrial = [0]; 	// ball's Y coordinate on current trial
	var	endTrial = false;	// flag whether the current trial is complete
	var	firing = false;		// flag whether the slingshot was fired
	var inTheHole = false;  // flag whether the ball went through the hold
	var intro = 0;  	    // use to determine which instructions to display during introduction
    let warning = false      // warn participants not to leave play area
    let dragging = false     // true when user is drawing sling

	// data to save
	game.data = {
		ballX: [],			// ball's X coordinates on all trials
		ballY: [], 			// ball's Y coordinates on all trials
		totalTrials: 0,		// total number of trials
		totalScore: 0		// total times getting the ball through the hole
	};

	// run slingshot game
	game.run = function(c, trial) {

        // NEW: Stop any previous runner and renderer before starting a new one.
        // This is the core fix for the speed-up issue.
        if (game.runner) {
            Runner.stop(game.runner);
        }
        if (game.render) {
            Render.stop(game.render);
        }

		// import settings
		var set = {
			ball: {
				x: trial.ball_xPos*c.width, 
				y: trial.ball_yPos*c.height, 
				rad: trial.ball_size, 
				fric: trial.friction, 
				col: trial.ball_color
			},
			wall: {
				x: trial.wall_xPos*c.width,
				yTop: (1/6)*(c.height-trial.hole_size),
				yBottom: (5/6)*c.height + (1/6)*trial.hole_size,
				width: trial.wall_width,
				height: .5*(c.height-trial.hole_size),
				col: trial.wall_color
			},
			sling: {
				stiffness: trial.tension,
				x: trial.ball_xPos*c.width,
				y: trial.ball_yPos*c.height
			},
			canvas: {
				height: c.height,
				width: c.width
			}
		};

		// create renderer
		var render = Render.create({ 
			engine: engine, 
			canvas: c, 
			options: {
				height: set.canvas.height,
				width: set.canvas.width,
				wireframes: false,
				writeText: text
			}
		});

		// construct ball
		class Ball {
			constructor() {
				this.body = Bodies.circle(set.ball.x, set.ball.y, set.ball.rad, {
					frictionAir: set.ball.fric,
					render: {
						fillStyle: set.ball.col,
					}
				});
				World.add(engine.world, this.body);
			}
		};

		// construct target
		class Wall {
			constructor(y, tri) {
				this.body = Bodies.fromVertices(set.wall.x, y, tri, {
					isStatic: true,
					render: {
						fillStyle: set.wall.col,
					}
				});
				World.add(engine.world, this.body);
			}
		};

		// construct sling
		class Sling {
			constructor() {
				this.body = Matter.Constraint.create({
					pointA: { x: set.sling.x, y: set.sling.y },
					bodyB: ball,
					stiffness: set.sling.stiffness,
				});
				World.add(engine.world, this.body);
			}
		};

		// construct mouse
		function makeMouse() {		
			mouse = Mouse.create(render.canvas);
			mouseConstraint = MouseConstraint.create(engine, {
				mouse: mouse,
				constraint: {
					render: {visible: false}
				}
			});
			World.add(engine.world, mouseConstraint);
			render.mouse = mouse;
		}

		// construct text
		function text(canvas, options, c)  {
				const drawText = (font, color, text, x, y, align = 'left') => {
					c.font = font;
					c.fillStyle = color;
					c.textAlign = align;
					c.fillText(text, x, y);
				};
			
				const drawInstructionalMessages = () => {

                if (warning) {
                    drawText("bold 25px Arial", "red", "Please stay inside the play area.", 75, 350);          
                }

				if (intro <= 3) {
					drawText("bold 20px Arial", "red", "Shoot the ball through the hole.", canvas.width / 2, 60, 'center');
				}
			
				if (game.data.totalTrials === 0 && intro <= 2) {
					drawText("16px Arial", "white", "Step 1: Click and hold the ball. Keeping your cursor in the play area,", canvas.width / 2, 100, 'center');
					drawText("16px Arial", "white", "pull the ball to the left to draw your sling.", canvas.width / 2, 120, 'center');
				}
			
				if (game.data.totalTrials === 0 && intro > 0 && intro <= 2) {
					drawText("16px Arial", "white", "Step 2: Aim at the hole,", canvas.width / 2, 160, 'center');
					drawText("16px Arial", "white", "then release the ball to launch.", canvas.width / 2, 180, 'center');
				}
			
				if (game.data.totalTrials === 1 && intro > 1 && intro <= 3) {
					drawText("16px Arial", "white", "Good job! Please spend the next few", canvas.width / 2, 100, 'center');
					drawText("16px Arial", "white", "minutes playing Hole in One. We'll let", canvas.width / 2, 120, 'center');
					drawText("16px Arial", "white", "you know when time is up.", canvas.width / 2, 140, 'center');
				}
			};
		
			drawInstructionalMessages();
		};

		// shoot sling
		function shootSling() {	
			Events.on(mouseConstraint, 'startdrag', function(e) {
                tracker.ball = ball;
                dragging = true;
                endTrial = false;
                if (!warning) {
                    intro++;
                } else {
                    warning = false;
                };     
			});
			Events.on(mouseConstraint, 'enddrag', function(e) {
				if(e.body === ball) { 
					firing = true;
                    record = true;
                    dragging = false;
				};
			});
			Events.on(engine, 'beforeUpdate', function() {
				var xDelta = Math.abs(ball.position.x-set.ball.x);
				var yDelta = Math.abs(ball.position.y-set.ball.y);
				if(firing && xDelta<set.ball.rad && yDelta<set.ball.rad) {
					sling.bodyB = null;
					sling.pointB.x = set.ball.x;
					sling.pointB.y = set.ball.y;
					firing = false;
					intro++;
				};
			});
		};

        // reset and warn when mouse leaves play area
        c.addEventListener("mouseleave", () => {
            // reset sling if player leaves canvas
            if (dragging & !warning) {
                warning = true;
                World.remove(engine.world, ball)
                ball = new Ball().body;
                sling.bodyB = ball;
                makeMouse();
                shootSling();
                trackBall();
                recordData();
            }
        });

		// track location of ball
		function trackBall() {		
			Events.on(engine, "beforeUpdate", function() {
				var xLoc = tracker.ball.position.x;
				var yLoc = tracker.ball.position.y;
				var xLimR = set.canvas.width*1.5;
				var xLimL = set.ball.x;
				var yLim = set.canvas.height;
				if (xLoc>xLimL && xLoc<xLimR && yLoc<yLim) {
					ballXtrial.push(xLoc);
					ballYtrial.push(yLoc);
				}
				if (xLoc > set.wall.x && !endTrial) {
					inTheHole = true;
				}
			});
		}

		// record data
		function recordData() {
			Events.on(engine, "beforeUpdate", function () {
				var xLoc = tracker.ball.position.x
				var yLoc = tracker.ball.position.y
				var xLim = set.canvas.width;
				var yLim = set.canvas.height;
				if(!endTrial && yLoc>(yLim*2) || !endTrial && xLoc>(xLim*2)) {

					// save data
					game.data.ballX.push(ballXtrial);
					game.data.ballY.push(ballYtrial);
					game.data.totalTrials++;
					if (inTheHole) game.data.totalScore++;

					// reset variables
					ballXtrial = [0];
					ballYtrial = [0];
					endTrial = true;
					inTheHole = false;

					// replace ball
					ball = new Ball().body;
					sling.pointB.x = null;
					sling.pointB.y = null;
					sling.bodyB = ball;
				};
			})
		}

		// specify vertices for walls
		var topWallVert = Vertices.fromPath(`0 0 0 ${set.wall.height} ${set.wall.width} 0`)
		var bottomWallVert = Vertices.fromPath(`0 0 0 ${set.wall.height} ${set.wall.width} ${set.wall.height}`)

		// construct bodies and mouse
		var ball = new Ball().body;
		var tracker = { ball: ball };
		var triWallTop = new Wall(set.wall.yTop, topWallVert).body;
		var triWallBottom = new Wall(set.wall.yBottom, bottomWallVert).body;
		var sling = new Sling().body;
		makeMouse();

		// call functions
		shootSling();
		trackBall();
		recordData();

        // run the renderer
        Render.run(render);

        // create runner
        var runner = Runner.create();

        // run the engine
        Runner.run(runner, engine);

        // NEW: Store the new instances so they can be stopped next time.
        game.render = render;
        game.runner = runner;
	};

	return game;

}());