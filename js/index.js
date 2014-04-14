set_emotions();
request_user();
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
    $(".unread").click(function(){
        $(this).hide();
    });
    $(document).scroll(function(){
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
            //滚动到底部重新请求新的feed
            if(scrollTop/(contentH -viewH)>=0.91){
                request_feed(1, 21, 0, $(".feed").not("#demo").last().attr("id"));
            }
            init_flag = false;
        }
    });
    $(".tips").click(function(){
        //document.location.reload();
        var count = parseInt($(this).find("a").text());
        request_feed(1, count, $(".feed").not("#demo").first().attr("id"));
        $(this).hide();
    });
    unread();
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
            if (msg.data.mention_status != 0) {
                $(".unread-at").show().find(".badge").text(msg.data.mention_status);
            }
            if (msg.data.cmt != 0) {
                $(".unread-comments").show().find(".badge").text(msg.data.cmt);
            }
            if (msg.data.dm != 0) {
                $(".unread-msg").show().find(".badge").text(msg.data.dm);
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

function request_user() {
    $.ajax({
        url:"https://api.weibo.com/2/account/get_uid.json?source=2975945008",
        dataType:"jsonp",
        method:"get",
        success:render_user,
    });
}

function render_user(msg) {
    uid = msg.data.uid;
}

function render_feed(msg, flag) {
    var statuses = msg.data.statuses;
    if (flag == true) {
        if (statuses[0].id == $(".feed").not("#demo").last().attr("id")) statuses.shift();
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
    $section.find(".detail > .text").html(parse_status(obj.text)).parent().parent().attr("id", obj.id);
    

    var $foot = $section.find(".detail > .foot");
    $foot.find(".time").text(to_date(obj.created_at));
    $foot.find(".source").html("来自"+obj.source);
    var jump_url = "http://api.weibo.com/2/statuses/go?source=2975945008&uid=" + obj.user.id + "&id=" + obj.mid;
    $foot.find(".reposts").text("转发(" + obj.reposts_count + ")").attr("href", jump_url);
    $foot.find(".comments").text("评论(" + obj.comments_count + ")").attr("href", jump_url);
    $foot.find(".attitudes").text("(" + obj.attitudes_count + ")").attr("href", jump_url).prepend($("<i class='icon-good'></i>"));
    

    if (obj.user.verified == true) {
        if (obj.user.verified_type == 0) {
            $section.find(".detail > .user").append("<i class='icon-approve'></i>");
        } else {
            $section.find(".detail > .user").append("<i class='icon-approve-organization'></i>");
        }
    }
    
    if (obj.pic_urls.length > 0 ) {
        for (var i in obj.pic_urls) {
            var $img = $("<img>").attr("src", obj.pic_urls[i].thumbnail_pic).addClass("big-cur");
            if (obj.pic_urls.length > 1 ) {
                $img.addClass("mulity-image");
                $img.attr("src", obj.pic_urls[i].thumbnail_pic.replace("thumbnail", "square"));
            } else {
                $img.click(function(){
                    var src = $(this).attr("src");
                    if (src.indexOf("thumbnail") > 0) {
                        $(this).removeClass("big-cur")
                                .addClass("small-cur")
                                .attr("src", obj.pic_urls[i].thumbnail_pic.replace("thumbnail", "bmiddle"));
                    } else {
                        $(this).removeClass("small-cur")
                                .addClass("big-cur")
                                .attr("src", obj.pic_urls[i].thumbnail_pic);
                        //window.location.href = "#" + $section.attr("id");
                    }
                });
            }
            if (obj.pic_urls.length <= 3 ) {
                var width = 85*obj.pic_urls.length;
            } else {
                var width = 85*Math.ceil(Math.sqrt(obj.pic_urls.length));
            }
            $section.find(".image").append($img).css("width", width);
        }
    }


    var retweeted_status = obj.retweeted_status;
    var $retweeted = $section.find(".retweeted");

    if (obj.hasOwnProperty("retweeted_status")) {
        if (retweeted_status.deleted == "1") {
            $retweeted.find(".forward-content").html("该微博已被删除");
        } else {
            var jump_url = "http://api.weibo.com/2/statuses/go?source=2975945008&uid=" + retweeted_status.user.id + "&id=" + retweeted_status.mid;
            $retweeted.find(".user-from a").text("@" + retweeted_status.user.screen_name).attr("href", "http://weibo.com/" + retweeted_status.user.profile_url);

            if (retweeted_status.user.verified == true) {
                if (retweeted_status.user.verified_type == 0) {
                    $retweeted.find(".forward-content > .user-from").append("<i class='icon-approve'></i>");
                } else {
                    $retweeted.find(".forward-content > .user-from").append("<i class='icon-approve-organization'></i>");
                }
            }
            if (retweeted_status.pic_urls.length > 0 ) {
                for (var i in retweeted_status.pic_urls) {
                    var $img = $("<img>").attr("src", retweeted_status.pic_urls[i].thumbnail_pic).addClass("big-cur");
                    if (retweeted_status.pic_urls.length > 1) {
                        $img.addClass("mulity-image");
                        $img.attr("src", retweeted_status.pic_urls[i].thumbnail_pic.replace("thumbnail", "square"));
                    }  else {
                        $img.click(function(){
                            var src = $(this).attr("src");
                            if (src.indexOf("thumbnail") > 0) {
                                $(this).removeClass("big-cur")
                                        .addClass("small-cur")
                                        .attr("src", src.replace("thumbnail", "bmiddle"));
                            } else {
                                $(this).removeClass("small-cur")
                                        .addClass("big-cur")
                                        .attr("src", retweeted_status.pic_urls[i].thumbnail_pic);
                            }
                        });
                    }

                    if (retweeted_status.pic_urls.length <= 3) {
                        var width = 85*retweeted_status.pic_urls.length;
                    } else {
                        var width = 85*Math.ceil(Math.sqrt(retweeted_status.pic_urls.length));
                    }
                    $retweeted.find(".image").append($img).css("width", width);
                }
            }

            var $foot = $retweeted.find(".foot");
            $foot.find(".time").text(to_date(retweeted_status.created_at));
            $retweeted.find(".text").html(parse_status(retweeted_status.text));
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
    return text.replace(/\[([^\[\]]+?)\]/g, function(str){
        var key = str.replace(/[\[\]]/g, '');
        if (key in emotions) {
            return "<img alt='" + str + "' src='" + emotions[key] + "'>";
        }
        else return str;
    });
}
function parse_status(status) {
    return get_at(get_emotion(get_url(status)));
}
function get_url(url) {
    return url.replace(
        /(?:(http|https):\/\/)(?:(\w+):?(\w+)?@)?([^:\/\?\s\[\]#]+)(?::(\d+))?(\/[^\?\s\[\]#]+)?(?:\?([^\s\[\]#]+))?(?:#(\w+))?/,
        function(str) {
            console.log(str);
            return "<a href='" + str + "'>" + str + "</a>";
        }
    );
}
function get_at(text) {
    return text.replace(/@([^\s@\:]+)/g, function(str) {
        $.ajax({
            url:"https://api.weibo.com/2/users/show.json?source=2975945008&screen_name=" + encodeURI(str.replace(/[@\s\:]/g, "")),
            dataType:"jsonp",
            method:"get",
            async:false,
            success:function(user) {
                str = "<a href='http://weibo.com/u/" + user.data.id + "'>" + str + "</a>";
                console.log(str);
            }
        });
        console.log(str);
        return str;
    });
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

