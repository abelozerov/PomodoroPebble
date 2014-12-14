/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */
var color = "white";
var backgroundColor = "black";

console.log("Hello it's Pomodoro Pebble");
console.log("Date: " + (new Date().getTime() / 1000));

var UI = require('ui');
var Vector2 = require('vector2');
var ajax = require('ajax');
var Vibe = require('ui/vibe');

var constants = {
  workIntervalLength: 1500/60, // seconds,
  restIntervalLength: 300/60 // seconds
}

// Create the Window
var window = new UI.Window();
window.fullscreen(true);

// Create TimeText
var timeText = new UI.TimeText({
  position: new Vector2(10, 26),
  size: new Vector2(124, 42),
  text: "%H:%M",
  font: 'bitham-42-medium-numbers',//'bitham-42-medium-numbers',
  color: color,
  textAlign: 'left'
});
window.add(timeText);

// Create a background Rect
/*var bgRect = new UI.Rect({
  position: new Vector2(10, 95),
  size: new Vector2(104, 60),
  backgroundColor: 'white'
});

// Add Rect to Window
window.add(bgRect);*/

// Create Pomodoro #
var pomodoroNumberText = new UI.Text({
  position: new Vector2(10, 90),
  size: new Vector2(124, 18),
  text: "Pomodoro #1",
  font: 'gothic-18-bold',
  color: color,
  textAlign: 'left'
});
var pomodoroTimeText = new UI.Text({
  position: new Vector2(10, 110),
  size: new Vector2(124, 21),
  text: "25:00",
  font: 'roboto-condensed-21',
  color: color,
  textAlign: 'left'
});
window.add(pomodoroNumberText);
window.add(pomodoroTimeText);

// Side buttons UI
var pauseButton = new UI.Image({
  position: new Vector2(129, 33),
  size: new Vector2(10, 10),
  image: 'images/icon-play.png'
});
window.add(pauseButton);
/*var playButton = new UI.Image({
  position: new Vector2(131, 78),
  size: new Vector2(7, 13),
  image: 'images/icon-play.png'
});
window.add(playButton);*/
var stopButton = new UI.Image({
  position: new Vector2(129, 125),
  size: new Vector2(10, 10),
  image: 'images/icon-stop.png'
});
window.add(stopButton);

// Show the Window
window.show();

window.on('click', 'up', function(e) {
  if(currentView == "in progress")
    sendTimerMessage("pause");
  else
    sendTimerMessage("start");
});

window.on('click', 'down', function(e) {
  sendTimerMessage("stop");
});


// Update from server - code

// Logic on watch
setInterval(function() {
  ajax(
  {
    url: 'http://pomodoro.abelozerov.com/timer',
    type: 'json'
  },
  function(data) {
    //console.log('Timer data from server is: ' + JSON.stringify(data));
    onTimerStateReceived(data)
  },
  function(error) {
    console.log('The ajax request GET /timer failed: ' + error);
  }
);

}, 200);

function sendTimerMessage(message) {
  //$.post("timer/" + message, function(data, txtStatus, xhr) {
  //  onTimerStateReceived(data);
  //})
  ajax(
  {
    url: 'http://pomodoro.abelozerov.com/timer/' + message,
    method: "POST",
    type: 'json'
  },
  function(data) {
    //console.log('Timer data from server is: ' + JSON.stringify(data));
    onTimerStateReceived(data)
  },
  function(error) {
    console.log('The ajax request sendTimerMessage failed: ' + error + "; message sent: " + JSON.stringify(message));
  });
}

var prevTimerState = null;
function onTimerStateReceived(timerState) {
  
  if(prevTimerState && prevTimerState.type != timerState.type) {
    // Trigger a vibration
    Vibe.vibrate('short');
  }

  var interval = 0;
  if (timerState.type == 'work') {
    interval = constants.workIntervalLength;
    //$(".pb-app").removeClass("pb-app-state-rest");
    pomodoroNumberText.text("Pomodoro #" + timerState.pomodoroCounter);
  } else if (timerState.type == "rest") {
    interval = constants.restIntervalLength;
    //$(".pb-app").addClass("pb-app-state-rest");
    pomodoroNumberText.text("Take a rest");
  }
  var minutes = Math.floor(interval / 60);
  var seconds = interval % 60;
  var elapsed = 0;

  if(timerState.state == "progress") {

    if (timerState.timestampStarted) {
      elapsed = (timerState.timestampStarted + interval) - _getCurrentTimestamp();
    }
    _renderInProgressView();

  } else if(timerState.state == "paused") {

    if (timerState.timestampStarted && timerState.timestampPaused) {
      elapsed = interval - (timerState.timestampPaused - timerState.timestampStarted);
    }
    _renderPausedView();

  } else if(timerState.state == "stopped") {

    _renderStoppedView();

  }

  if(elapsed) {
    if(timerState.type == 'work' && elapsed > constants.workIntervalLength
    || timerState.type == 'rest' && elapsed > constants.restIntervalLength)
      elapsed--;
    
    minutes = Math.floor(elapsed / 60);
    seconds = elapsed % 60;
    
    if(minutes<0)
      minutes=0;
    if(seconds<0)
      seconds=0;
  } else {
    if(timerState.state != "stopped")
      minutes = seconds = 0;
  }
  
  pomodoroTimeText.text((minutes < 10? "0" : "") + minutes + ":" + (seconds < 10? "0" : "") + seconds);
  prevTimerState = timerState;
}

function _getCurrentTimestamp() {
  return Math.floor(new Date().getTime() / 1000) + 3595; // 3595 - durty hack to make it synced with Amazon instance
}

var currentView = "";
function _renderInProgressView() {
  if(currentView != "in progress") {
    pauseButton.image('images/icon-pause.png');
    pauseButton.size(new Vector2(10, 10));
  }
  currentView = "in progress"; 
  //$(".pb-btn-start").hide();
  //$(".pb-btn-pause").show();
  //$(".pb-btn-stop").show();
}

function _renderPausedView() {
  if(currentView != "paused") {
    pauseButton.image('images/icon-play.png');
    pauseButton.size(new Vector2(7, 13));
  }
  currentView = "paused";
  //$(".pb-btn-start").show();
  //$(".pb-btn-pause").hide();
  //$(".pb-btn-stop").show();
}

function _renderStoppedView() {
  if(currentView != "stopped") {
    pauseButton.image('images/icon-play.png');
    pauseButton.size(new Vector2(7, 13));
  }
  currentView = "stopped";
  //$(".pb-btn-start").show();
  //$(".pb-btn-pause").hide();
  //$(".pb-btn-stop").hide();
}