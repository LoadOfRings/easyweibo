$(document).ready(function(){
    var source = document.location.hash.substr(1) || "2975945008";
    $.ajax({
        url:"http://i.api.weibo.com/2/statuses/friends_timeline.json?source=" + source,
        dataType:"jsonp",
        method:"get",
        success:render_feed,
        error:function(){
            alert("error");
        }
    });
});

function render_feed(msg) {
    var statuses = msg.data.statuses;
    for (var i in statuses) {
        $(".container").append(
            render_one_feed(statuses[i])
        );
    }
    $("#demo").hide();
}
function render_one_feed(obj) {
    var $section = $("#demo").clone();
    $section.find(".face img").attr("src", obj.user.profile_image_url);
    $section.find(".user a").text(obj.user.screen_name);
    $section.find(".detail > .text").text(obj.text);
    var $foot = $section.find(".detail > .foot");
    $foot.find(".time").text(obj.created_at);
    $foot.find(".source").html("来自"+obj.source);
    $foot.find(".reposts").text("转发(" + obj.reposts_count + ")");
    $foot.find(".comments").text("评论(" + obj.comments_count + ")");
    $foot.find(".attitudes").text("(" + obj.attitudes_count + ")");

    if (obj.user.verified == false) {
        $section.find(".detail > .user .icon-approve").remove();
    }

    var retweeted_status = obj.retweeted_status;
    var $retweeted = $section.find(".retweeted");

    if (obj.hasOwnProperty("retweeted_status")) {
        $retweeted.find(".user-from a").text(retweeted_status.user.screen_name);
        if (retweeted_status.user.verified == false) {
            $retweeted.find(".icon-approve").remove();
        }

        var $foot = $retweeted.find(".foot");
        $foot.find(".time").text(retweeted_status.created_at);
        $foot.find(".source").html("来自" + retweeted_status.source);
        $foot.find(".reposts").text("转发(" + retweeted_status.reposts_count + ")");
        $foot.find(".comments").text("评论(" + retweeted_status.comments_count + ")");
        $foot.find(".attitudes").text("(" + retweeted_status.attitudes_count + ")");
    } else {
        $retweeted.remove();
    }
    return $section;
}
