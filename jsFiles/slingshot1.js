/* 
 *  Slingshot Game
 *  David E. Melnikoff
 * (and a little by Angikar Ghosal)
 *  A slingshot game compatible with jsPsych
 *
 */


var slingshot1 = (function () {

    var game = {};
    
    // import methods from matter.js and define physics engine
    var { Engine, Runner, Render, Composite, World, Bodies, Events, Mouse, MouseConstraint } = Matter;
    var engine = Engine.create();

    // temporary data
    var ballXtrial = []; 	 // ball's X coordinates on current trial
    var ballYtrial = []; 	 // ball's Y coordinates on current trial
    var distTrial = [];      // distance from target on current trial
    var	hit = false;		 // flag whether hit occurred on current trial
    var hitFilter = [false]; // filter out repeat hits
    var	endTrial = false;	 // flag whether the current trial is complete
    var	firing = false;		 // flag whether the slingshot1 was fired
    var record = false;      // flag whether to record data
    var intro = 0;  	     // use to determine which instructions to display during introduction
    var loc = 0;			 // current element of target's y-axis location array  
    var streak = 0;			 // length of current streak
    var missMssg = null      // message to display after miss in non-streak condition
    let warning = false      // warn participants not to leave play area
    let dragging = false     // true when user is drawing sling

    // data to save
    game.data = {
        ballX: [],			// ball's X coordinates on all trials
        ballY: [], 			// ball's Y coordinates on all trials
        dist: [],           // ball's distance from target on all trials
        minDist: [],        // ball's minimum distance from target
        minDistMM: [],      // ball's minimum distance from target in millimeters
        outcome: [],		// outcome on each trial
        totalHits: 0,		// total number of hits
        totalTrials: 0,		// total number of trials
        targetLoc: []		// target's y-axis location on all trials 
    };
    
    // run slingshot1 game
    game.run = function(c, trial, mmPerPx) {
    
        console.log('start')

        // import settings
        var set = {
            ball: {
                x: trial.ball_xPos*c.width, 
                y: trial.ball_yPos*c.height, 
                rad: trial.ball_size, 
                fric: trial.friction, 
                col: trial.ball_color
            },
            target: {
                x: trial.target_xPos*c.width, 
                y: trial.target_yPos.map(y => { return y*c.height }), 
                rad: trial.target_size, 
                col: trial.target_color, 
                colHit: trial.target_color_hit
            },
            frame: {
                streak: trial.game_type,
                money: trial.money
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
    
        var goalMssg1 = "You can play Target Practice however you want!";

        var goalMssg2 = "";

        var moneyMssg = "Good luck!";

        let gameName = 'Target Practice!'

    
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
        class Target {
            constructor(loc) {
                this.body = Bodies.circle(set.target.x, set.target.y[loc], set.target.rad, {
                    isStatic: true,
                    render: {
                        fillStyle: set.target.col,
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
        function text(canvas, options, c) {
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
                    drawText("bold 20px Arial", "red", goalMssg1, canvas.width / 2, 40, 'center');
                    drawText("bold 20px Arial", "red", goalMssg2, canvas.width / 2, 60, 'center');
                    drawText("bold 20px Arial", "red", moneyMssg, canvas.width / 2, 80, 'center');
                }
        
                if (game.data.totalTrials === 0 && intro <= 2) {
                    drawText("16px Arial", "white", "Step 1: Click and hold the ball. Keeping your cursor in the play area,", canvas.width / 2, 100, 'center');
                    drawText("16px Arial", "white", "pull the ball to the left to draw your sling.", canvas.width / 2, 120, 'center');
                    drawText("16px Arial", "white", "Step 2: Release the ball to launch!", canvas.width / 2, 160, 'center')
                }
        
                if (game.data.totalTrials === 1 && intro > 1 && intro <= 3) {
                    drawText("16px Arial", "white", "Please spend the next few", canvas.width / 2, 100, 'center');
                    drawText("16px Arial", "white", `minutes playing ${gameName}. We'll let`, canvas.width / 2, 120, 'center');
                    drawText("16px Arial", "white", "you know when time is up.", canvas.width / 2, 140, 'center');
                }
            };
        
            const drawStreakMessages = () => {
                if (set.frame.streak) {
                    if (streak === 0 && length > 0 && endTrial) {
                        drawText("30px Arial", "white", "Your streak was:", canvas.width / 2, 220, 'center');
                        drawText("30px Arial", "white", `${length}`, canvas.width / 2, 270, 'center');
                    } else if ((streak > 0 && hit) || (streak > 0 && endTrial) || (streak === 0 && length === 0 && endTrial)) {
                        drawText("30px Arial", "white", "Current hit streak:", canvas.width / 2, 220, 'center');
                        drawText("30px Arial", "white", `${streak}`, canvas.width / 2, 270, 'center');
                    }
                } else {
                    if (streak === 0 && endTrial) {
                        drawText("35px Arial", "white", "Distance from target:", canvas.width / 2, 220, 'center');
                        drawText("35px Arial", "white", missMssg, canvas.width / 2, 270, 'center');
                    } else if ((streak > 0 && hit) || (streak > 0 && endTrial)) {
                        drawText("35px Arial", "white", "Hit!", canvas.width / 2, 245, 'center');
                    }
                }
            };
            
            const drawDistanceHistory = () => {
                drawText("16px Arial", "white", "Previous Distances from Target:", 10, 40);
                game.data.minDistMM.forEach((dist, i) => {
                    const displayDist = game.data.outcome[i] ? "0 (Hit)" : `${dist}mm`;
                    drawText("16px Arial", "white", `${i+1}. ${displayDist}`, 10, 60 + i * 20);
                });
            };
    
            drawInstructionalMessages();
            /*
            drawStreakMessages();
            if (intro>3)
            {
            drawDistanceHistory();
            }
            */
        }

        // shoot sling
        function shootSling() {	
            Events.on(mouseConstraint, 'startdrag', function(e) {
                target.render.fillStyle = set.target.col;
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
                }
            });
            Events.on(engine, 'beforeUpdate', function() {
                var xDelta = Math.abs(ball.position.x-set.ball.x);
                var yDelta = Math.abs(ball.position.y-set.ball.y);
                if(firing && xDelta<set.ball.rad && yDelta<set.ball.rad) {
                    sling.bodyB = null;
                    sling.pointB.x = set.ball.x;
                    sling.pointB.y = set.ball.y;
                    firing = false;
                    intro ++;
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
                if (record) {
                    ballXtrial.push(xLoc);
                    ballYtrial.push(yLoc);
                    distTrial.push(Math.hypot(xLoc - set.target.x, yLoc - set.target.y[loc]) - (set.ball.rad + set.target.rad));
                }
            });
        }
    
        // detect hit
        function recordHit() {
            Events.on(engine, 'collisionStart', function(event) {
                target.render.fillStyle = set.target.colHit;
                hit = true;
                hitFilter.push(hit);
                if (hitFilter[hitFilter.length-1] != hitFilter[hitFilter.length-2]) {
                    game.data.totalHits++;
                    streak++;
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
    
                    // stop recording data
                    record = false;
    
                    // minimum distance
                    minDistTrial = Math.min.apply(null, distTrial);
                    minDistTrialMM = Math.floor(minDistTrial/mmPerPx);
                    missMssg = (minDistTrialMM > 1) ? `${minDistTrialMM}mm` : `1mm`;
    
                    // save data
                    game.data.ballX.push(ballXtrial);
                    game.data.ballX.push('END');
                    game.data.ballY.push(ballYtrial);
                    game.data.ballY.push('END');
                    game.data.dist.push(distTrial);
                    game.data.minDist.push(minDistTrial);
                    game.data.minDistMM.push(minDistTrialMM);
                    game.data.targetLoc.push(set.target.y[loc]);
                    game.data.outcome.push(hit);
                    game.data.totalTrials++;
                    if (!hit) {
                        length = streak;
                        streak = 0;
                    };
    
                    // reset variables
                    ballXtrial = [];
                    ballYtrial = [];
                    distTrial = [];
                    hit = false;
                    hitFilter.push(hit);
                    endTrial = true;
    
                    // replace ball
                    ball = new Ball().body;
                    sling.pointB.x = null;
                    sling.pointB.y = null;
                    sling.bodyB = ball;
    
                    // relocate target
                    Composite.remove(engine.world, target);
                    loc = Math.floor(Math.random() * set.target.y.length);
                    target = new Target(loc).body;
                };
            })
        }

        // construct bodies and mouse
        var ball = new Ball().body;
        var tracker = { ball: ball };
        var target = new Target(loc).body;
        var sling = new Sling().body;
        makeMouse();
    
        // call functions
        shootSling();
        trackBall();
        recordHit();
        recordData();
        
        // run the renderer
        Render.run(render);

        // create runner
        var runner = Runner.create();

        // run the engine
        Runner.run(runner, engine);
    };
    
    return game;
    
    }());