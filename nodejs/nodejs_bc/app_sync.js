function sleep(millisceconds){
    var start = new Date().getTime();
    while((new Date().getTime() - start) < millisceconds);
}

function fetchPage(){
    console.log('获取 页面');
    sleep(2000);
    console.log('从页面返回数据');
}

function fetchApi(){
    console.log('获取 api');
    sleep(2000);
    console.log('从api返回数据')
}

fetchPage();
fetchApi();
