/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */
console.log("Hello it's Pomodoro Pebble");
console.log("Date: " + (new Date().getTime() / 1000));

var UI = require('ui');
var Vector2 = require('vector2');
var ajax = require('ajax');

var constants = {
  workIntervalLength: 1500/60, // seconds,
  restIntervalLength: 300/60 // seconds
}

// Create the Window
var window = new UI.Window();
window.fullscreen(true);

// Create TimeText
var timeText = new UI.TimeText({
  position: new Vector2(0, 20),
  size: new Vector2(124, 50),
  text: "%H:%M",
  font: 'bitham-42-light',
  color: 'white',
  textAlign: 'center'
});
window.add(timeText);

// Create a background Rect
var bgRect = new UI.Rect({
  position: new Vector2(10, 95),
  size: new Vector2(104, 60),
  backgroundColor: 'white'
});

// Add Rect to Window
window.add(bgRect);

// Create Pomodoro #
var pomodoroNumberText = new UI.Text({
  position: new Vector2(0, 100),
  size: new Vector2(124, 20),
  text: "Pomodoro #1",
  font: 'gothic-14-bold',
  color: 'black',
  textAlign: 'center'
});
var pomodoroTimeText = new UI.Text({
  position: new Vector2(0, 115),
  size: new Vector2(124, 25),
  text: "25:00",
  font: 'gothic-28-bold',
  color: 'black',
  textAlign: 'center'
});
window.add(pomodoroNumberText);
window.add(pomodoroTimeText);

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

function onTimerStateReceived(timerState) {

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
  
  pomodoroTimeText.text(minutes + ":" + seconds);
  //$(".pb-clock-minutes").text(minutes);
  //$(".pb-clock-seconds").text(seconds);
}

function _getCurrentTimestamp() {
  return Math.floor(new Date().getTime() / 1000) + 3595; // 3595 - durty hack to make it synced with Amazon instance
}

var currentView = "";
function _renderInProgressView() {
  currentView = "in progress";
  //$(".pb-btn-start").hide();
  //$(".pb-btn-pause").show();
  //$(".pb-btn-stop").show();
}

function _renderPausedView() {
  currentView = "paused";
  //$(".pb-btn-start").show();
  //$(".pb-btn-pause").hide();
  //$(".pb-btn-stop").show();
}

function _renderStoppedView() {
  currentView = "stopped";
  //$(".pb-btn-start").show();
  //$(".pb-btn-pause").hide();
  //$(".pb-btn-stop").hide();
}