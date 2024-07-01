var http = require("http");

function fetchPage(){
    console.log('获取页面');
    http.get({host:'trafficjamapp.herokuapp.com',path: '/?delay=2000'},
        function(res){
            console.log('从页面获取到数据');
        }
    ).on('error', 
        function(e){
            console.log("获取页面发生以下错误: " + e);
        }
    );
}

function fetchApi() {
    console.log("获取api");
    http.get({host:'trafficjamapp.herokuapp.com', path: '/?delay=2000'},
        function (res){
            console.log("从api获取到数据");
        }
    ).on('error',
        function(err){
            console.log("获取api时发生以下错误: " + e);
    });
}

fetchPage();
fetchApi();
