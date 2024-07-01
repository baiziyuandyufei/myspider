function haveBreakfast(food, drink, callback){
    console.log('早餐食物：' + food + ', ' + drink);
    if (callback && typeof(callback) === "function"){
        callback();
    }
}

haveBreakfast('面包', '咖啡', function(){
    console.log('吃了饭，现在要工作了');
});

