/* Fluksometer chart plotting script;
   retreives data stored via node persist_mqtt.js and
   served by node serve_chart.js

   uses the flotcharts.org plotting library - with the
   corresponding license

   this script under MIT-license, as is, without any
   warrenty

   Markus Gebhard, Karlsruhe, May 2014, (c) */

// determine locally stored time interval
var chart = new Array();
var options = {
      xaxis: { mode: "time", 
               timezone: "browser" },
      yaxis: { min: 0 },
      selection: { mode: "x" }
    };

var fromDate, fromTime, toDate, toTime;

// prepare channel to server
var socket = io.connect(location.host);
socket.on('connect', function () {
// get information to be printed within the chart div
  socket.on('info', function(info) {
    $("#info").html(info);
  }); //socket.on
// plot the received data series
  socket.on('series', function (res) {
// format the data object
    for (var i in res) {
      var serobj = {};
      serobj["label"] = i;
      serobj["data"] = res[i];
      chart.push(serobj);
    } //for
// size the output area
    var offset = 20; //px
    var width = $(document).width();
    width -= offset * 2;
    var height = width * 3 / 4;
    $("#chart").width(width).height(height).offset({left:offset});
// and finally plot the graph
    $('#info').html('');
    $("#chart").plot(chart, options);
// process selection time interval
    $("#chart").bind("plotselected", function(event, range) {
      var selFrom = range.xaxis.from.toFixed(0);
      var selTo = range.xaxis.to.toFixed(0);
      var selChart = new Array();
// filter values within the selected time interval
      for (var i in chart) {
        var selObj = {};
        selObj["label"] = chart[i].label;
        selObj["data"] = chart[i].data.filter(function(v) {return v[0] >= selFrom && v[0] <= selTo});
        selChart.push(selObj);
      } //for
      $("#chart").plot(selChart, options);
      $("#info").html('<div align=\"center\"><button id=\"reset\">Reset</button></div>');
// redraw the queried data
      $("#reset").click( function() {
        $("#chart").plot(chart, options);
      });
    });
  });
});
// executed after rendering the complete page; alternative: $(function() {});
$(document).ready(function() {
    $('#refresh').click(function() {
      var dNow = new Date();
      var day = dNow.getDate();
      day = (day<10?'0'+day:day);
      var month = dNow.getMonth()+1;
      month = (month<10?'0'+month:month);
      var hrs = dNow.getHours();
      hrs = (hrs<10?'0'+hrs:hrs);
      var min = dNow.getMinutes();
      min = (min<10?'0'+min:min);
      var sec = dNow.getSeconds();
      sec = (sec<10?'0'+sec:sec);
      var localDate = dNow.getFullYear() + '-' + month + '-' + day;
      var localTime = hrs + ':' + min + ':' + sec;
      $('#fromDate').val(localDate);
      $('#fromTime').val(localTime);
      $('#toDate').val(localDate);
      $('#toTime').val(localTime);
    });
    $('#submit').click(function() {
      fromDate = $('#fromDate').val();
      fromTime = $('#fromTime').val();
      toDate = $('#toDate').val();
      toTime = $('#toTime').val();
      emit();
    });
});

function emit() {
  var data = {};
  data.fromDate = fromDate;
  data.fromTime = fromTime;
  data.toDate = toDate;
  data.toTime = toTime;      
  $("#chart").html('<div align=\"center\">Loading...</div>');
  socket.emit('query', data);
}
