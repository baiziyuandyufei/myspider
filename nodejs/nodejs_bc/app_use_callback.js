var http = require('http');

http.get({host: 'shapeshed.com'}, function(res){
    console.log("获取 shapeshed.com 的响应");
}).on('error', function(e){
    console.log("获取 shapeshed.com 时有一个错误")
});
