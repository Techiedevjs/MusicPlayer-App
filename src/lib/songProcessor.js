
export function convertTime(duration) {
    var a = duration.match(/\d+/g);

    if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
        a = [0, a[0], 0];
    }

    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
        a = [a[0], 0, a[1]];
    }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
        a = [a[0], 0, 0];
    }

    duration = 0;

    if (a.length == 3) {
        duration = duration + parseInt(a[0]) * 3600;
        duration = duration + parseInt(a[1]) * 60;
        duration = duration + parseInt(a[2]);
    }

    if (a.length == 2) {
        duration = duration + parseInt(a[0]) * 60;
        duration = duration + parseInt(a[1]);
    }

    if (a.length == 1) {
        duration = duration + parseInt(a[0]);
    }
    return duration
}

export function getVideoId(url) {
    var video_id = url.split('v=')[1];
    var ampersandPosition = video_id.indexOf('&');
    if (ampersandPosition != -1) {
        video_id = video_id.substring(0, ampersandPosition);
    }
    return video_id;
}

export function formatTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}
