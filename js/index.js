set_emotions();
$(document).ready(function(){
    setInterval(function(){
        init_flag = true;
    }, 2000);
    $(".navigation .prev").click(function(){
        var scrollTop = document.querySelector(".index").scrollTop - 600;
        if (scrollTop <= 0) {
            scrollTop = 0;
        }
        document.querySelector(".navigation .index").scrollTop = scrollTop;
        check_scroll();
    });
    $(".navigation .next").click(function(){
        var scrollTop = document.querySelector(".index").scrollTop + 600;
        var max = ($(".navigation .index").children().length -15) *40;
        if (scrollTop > max ) scrollTop = max;
        document.querySelector(".navigation .index").scrollTop = scrollTop;
        check_scroll();
    });
    $(document).scroll(function(){
        /*
        if (window.scrollY > 500) {
            document.querySelector(".navigation").style.bottom = "100px"
        } else {
            document.querySelector(".navigation").style.bottom = "-700px"
        }*/
        var top = 0;
        var scrollTop = window.scrollY;
        var $feeds = $(".feed").not("#demo");
        $(".img-active").removeClass("img-active");
        for (var i in $feeds) {
            if (top > scrollTop) {
                $(".navigation img").eq(i-1).addClass("img-active");

                if ((i-15)*40 > document.querySelector(".index").scrollTop) {
                    $(".navigation .next").click();
                }
                if ((i)*40 < document.querySelector(".index").scrollTop) {
                    $(".navigation .prev").click();
                }
                break;
            }
            top += $feeds[i].clientHeight;
        }

        if (init_flag == true) {
            var viewH =$("body").height(),//可见高度
                contentH =$("body").get(0).scrollHeight,//内容高度
                scrollTop =$("body").scrollTop();//滚动高度
            if(scrollTop/(contentH -viewH)>=0.91){
                request_feed(1, 20, 0, $(".feed").not("#demo").last().id);
            }
            init_flag = false;
        }
    });
    $(".tips").click(function(){
        //document.location.reload();
        var count = parseInt($(this).find("a").text());
        request_feed(1, count, $(".feed").not("#demo")[0].id);
        $(this).hide();
    });
    setInterval(unread, 10000);
});


function unread() {
    $.ajax({
        url:"https://rm.api.weibo.com/2/remind/unread_count.json?source=2975945008",
        dataType:"jsonp",
        method:"get",
        success:function(msg){
            if (msg.data.status != 0) {
                $(".tips a").text(msg.data.status + "条新微博").parent().show();
            }
        },
        error:function(){
            //alert("error");
        }
    });
}

function check_scroll(){
    var scrollTop = document.querySelector(".index").scrollTop;
    var max = ($(".navigation .index").children().length -15) *40;
    if (scrollTop == 0) {
        $(".prev").addClass("disabled");
    } else {
        $(".prev").removeClass("disabled");
    }
    if (scrollTop == max) {
        $(".next").addClass("disabled");
    } else {
        $(".next").removeClass("disabled");
    }
    
}

function request_feed(page, count, since_id, max_id, source) {
    page = page || 1;
    count = count || 20;
    since_id = since_id || 0;
    max_id = max_id || 0;
    source = source || "2975945008";
    /*
    var href = document.location.href;
    if (href.indexOf("?") != -1) {
        param = href.split("?")[1];
    } else {
        param = "";
    }*/
    
    $.ajax({
        url:"http://api.weibo.com/2/statuses/friends_timeline.json?" + parse_param({
                page:page,
                count:count,
                since_id:since_id,
                max_id:max_id,
                source:source
            }),
        dataType:"jsonp",
        method:"get",
        success:function(msg) {
            if (since_id == 0 ) {
                render_feed(msg, true);
            } else {
                render_feed(msg, false);
            }
        },
        error:function(){
            //alert("error");
        }
    });
}

function render_feed(msg, flag) {
    var statuses = msg.data.statuses;
    if (flag == true) {
        for (var i in statuses) {
            $("#feed").append(
                render_one_feed(statuses[i])
            );
            $(".navigation .index").append(
                render_one_img(statuses[i])
            );
        }
    } else {
        statuses = statuses.reverse();
        for (var i in statuses) {
            $(".tips").after(
                render_one_feed(statuses[i])
            );
            $(".navigation .index").prepend(
                render_one_img(statuses[i])
            );
        }
    }

    $("#demo").hide();
    check_scroll();
}

function render_one_img(obj){
    var img_url = obj.user.profile_image_url.replace(/\/50\//, "\/30\/");
    return $("<a href='#" + obj.id +"'></a>").append($("<img>").attr("src", img_url));
}
function render_one_feed(obj) {
    var $section = $("#demo").clone().show();
    $section.find(".face img").attr("src", obj.user.profile_image_url).parent().attr("href", "http://weibo.com/" + obj.user.profile_url);
    $section.find(".user a").text(obj.user.screen_name).attr("href", "http://weibo.com/" + obj.user.profile_url);
    $section.find(".detail > .text").html(get_emotion(obj.text)).parent().parent().attr("id", obj.id);
    var $foot = $section.find(".detail > .foot");
    $foot.find(".time").text(to_date(obj.created_at));
    $foot.find(".source").html("来自"+obj.source);
    var jump_url = "http://api.weibo.com/2/statuses/go?source=2975945008&uid=" + obj.user.id + "&id=" + obj.mid;
    $foot.find(".reposts").text("转发(" + obj.reposts_count + ")").attr("href", jump_url);
    $foot.find(".comments").text("评论(" + obj.comments_count + ")").attr("href", jump_url);
    $foot.find(".attitudes").text("(" + obj.attitudes_count + ")").attr("href", jump_url).prepend($("<i class='icon-good'></i>"));

    if (obj.user.verified == false) {
        $section.find(".detail > .user .icon-approve").remove();
    }

    var retweeted_status = obj.retweeted_status;
    var $retweeted = $section.find(".retweeted");

    if (obj.hasOwnProperty("retweeted_status")) {
        if (retweeted_status.deleted == "1") {
            $retweeted.find(".forward-content").html(get_emotion(retweeted_status.text));
        } else {
            var jump_url = "http://api.weibo.com/2/statuses/go?source=2975945008&uid=" + retweeted_status.user.id + "&id=" + retweeted_status.mid;
            $retweeted.find(".user-from a").text(retweeted_status.user.screen_name).attr("href", "http://weibo.com/" + retweeted_status.user.profile_url);
            if (retweeted_status.user.verified == false) {
                $retweeted.find(".icon-approve").remove();
            }

            var $foot = $retweeted.find(".foot");
            $foot.find(".time").text(to_date(retweeted_status.created_at));
            $retweeted.find(".text").text(retweeted_status.text);
            $foot.find(".source").html("来自" + retweeted_status.source);
            $foot.find(".reposts").text("转发(" + retweeted_status.reposts_count + ")").attr("href", jump_url);
            $foot.find(".comments").text("评论(" + retweeted_status.comments_count + ")").attr("href", jump_url);
            $foot.find(".attitudes").text("(" + retweeted_status.attitudes_count + ")").attr("href", jump_url).prepend($("<i class='icon-good'></i>"));
        }
    } else {
        $retweeted.remove();
    }
    return $section;
}

function to_date(fDate) {
    //Fri Oct 31 18:00:00 UTC+0800 2011
    fDate=fDate+"";
    var date="";
    var month=new Array();
    month["Jan"]=1;month["Feb"]=2;month["Mar"]=3;month["Apr"]=4;month["May"]=5;month["Jan"]=6;
    month["Jul"]=7;month["Aug"]=8;month["Sep"]=9;month["Oct"]=10;month["Nov"]=11;month["Dec"]=12;
    str=fDate.split(" ");
    date=str[5]+"-";
    date=date+month[str[1]]+"-"+str[2] + " " + str[3];     
    return date;
}

function get_emotion(text){
    var m = text.match(/\[([^\[\]]+?)\]/g);
    if (m) {
        for (var i in m) {
            key = m[i].replace(/[\[\]]/g, '');
            if (emotions.hasOwnProperty(key))
                text = text.replace(m[i], "<img alt='" + key + "' src='" + emotions[key] + "'>");
        }
    }
    return text;
    //console.log(text.match(/\[([^\[\]]+?)\]/g));
    //console.log(text.replace(/\[([^\[\]]+?)\]/g, function(item){console.log(item)}));
    //return text.replace(/\[([^\[\]]+?)\]/g, "<img src='" + emotions['$1'] + "'>");
}

function set_emotions(){
    var emotions = {};
    for(var i in msg) {
        emotions[msg[i].value.replace(/[\[\]]/g, '')] = msg[i].url;
    }
    window.emotions = emotions;
    request_feed();
}

function parse_param(param, key){
    var paramStr="";
    if(param instanceof String||param instanceof Number||param instanceof Boolean){
        paramStr+="&"+key+"="+encodeURIComponent(param);
    }else{
        $.each(param,function(i){
            var k=key==null?i:key+(param instanceof Array?"["+i+"]":"."+i);
            paramStr+='&'+parse_param(this, k);
        });
    }
    return paramStr.substr(1);
};

