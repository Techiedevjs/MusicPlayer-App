<script>
import {songs, apiKey} from "../store/stores"
import { getVideoId, convertTime} from "../lib/songProcessor"
let songlink;
export let addToQueue;
export let playSong;
let songCount = 0;
let songinput;
const addSong = () => {
    if(songlink){
        Process(songlink)
        songlink = ''
    }
}
function getVideoDetails(videoId, callback) {
    var apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails&id=${videoId}&key=${apiKey}`;
    fetch(apiUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        var duration = convertTime(data.items[0].contentDetails.duration);
        var thumbnailUrl = data.items[0].snippet.thumbnails.default.url;
        callback(data.items[0].snippet.title, duration, thumbnailUrl);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function Process(songURL) {
    if (songURL) {
        var videoId = getVideoId(songURL);
        getVideoDetails(videoId, function (title, duration, thumbnailUrl) {
            if (title) {
                addToQueue(songURL, duration, title, thumbnailUrl, songCount);
                playSong()
                songCount++
            }
        });
    }
};
const applyBorder = () => {
    songinput.style.border = '1px solid #1BD760'
}
const removeBorder = () => {
    songinput.style.border = '1px solid transparent'
}
</script>

<div class="link-cont" class:border={songlink} bind:this={songinput}>
    <div class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="22" viewBox="0 0 23 22" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16.4346 3.98642C16.5073 4.04512 16.566 4.11937 16.6063 4.20372C16.6466 4.28807 16.6675 4.38037 16.6674 4.47384V13.8968C16.6672 14.3257 16.5202 14.7416 16.2508 15.0754C15.9815 15.4091 15.606 15.6406 15.1868 15.7313L13.4833 16.1003C13.0037 16.2041 12.5026 16.1131 12.0901 15.8474C11.6775 15.5817 11.3875 15.163 11.2836 14.6835C11.1798 14.2039 11.2708 13.7027 11.5365 13.2902C11.8022 12.8777 12.2209 12.5876 12.7004 12.4838L14.9222 12.0031C15.0621 11.9727 15.1873 11.8954 15.2771 11.7839C15.3668 11.6724 15.4157 11.5335 15.4155 11.3904V7.75311L8.73844 9.19702V15.6103C8.73861 16.0395 8.59178 16.4558 8.32238 16.7899C8.05298 17.124 7.67727 17.3557 7.2578 17.4465L5.55348 17.8138C5.31304 17.8737 5.06302 17.8846 4.81825 17.846C4.57349 17.8074 4.33897 17.7201 4.12863 17.5891C3.91829 17.4581 3.73642 17.2862 3.59381 17.0835C3.4512 16.8809 3.35076 16.6517 3.29846 16.4095C3.24616 16.1673 3.24306 15.917 3.28935 15.6736C3.33564 15.4301 3.43037 15.1985 3.56791 14.9924C3.70546 14.7863 3.88303 14.6099 4.09006 14.4738C4.29709 14.3376 4.52937 14.2444 4.7731 14.1998L6.99239 13.7207C7.13213 13.6906 7.25735 13.6136 7.34724 13.5024C7.43713 13.3913 7.48627 13.2527 7.48649 13.1098V6.18818C7.48648 6.0452 7.53541 5.90653 7.62515 5.79523C7.7149 5.68393 7.84003 5.6067 7.97976 5.57639L15.9088 3.86206C16.0001 3.8422 16.0948 3.84306 16.1858 3.86458C16.2768 3.8861 16.3618 3.92773 16.4346 3.98642Z" fill="#121212"/>
        </svg>
    </div>
    <p><input type="text" name="" id="" placeholder="Enter song URL" bind:value={songlink} on:focus={applyBorder} on:focusout={removeBorder}></p>
    <button on:click={addSong}>ADD SONG</button>
</div>

<style>
    .link-cont{
        display: flex;
        align-items: center;
        border-radius: 10px;
        background: rgba(18, 18, 18, 0.70);
        backdrop-filter: blur(6px);
        padding: 6px;
        width: 100%;
        gap: 8px;
        margin-bottom: 16px;
        transition: all .3s ease;
        border: 1px solid transparent;
    }
    .link-cont:hover, .border{
        border: 1px solid #1BD760;
    }
    .link-cont p{
        flex: 1;
    }
    .link-cont input{
        width: 100%;
        background: transparent;
        text-align: left;
        font-size: 12.874px;
        font-weight: 600;
        color: white;
    }
    input::placeholder{
        color: rgba(255, 255, 255, 0.40);
        font-size: 12.874px;
        font-weight: 600;
    }
    .link-cont button{
        border-radius: 6px;
        background: #1BD760;
        color: #121212;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.44px;
        padding: 8px 10px;
        width: max-content;
        border: none;
    }
    button:hover{
        opacity: 0.9;
    }
    .icon{
        border-radius: 6px;
        background: #FFF;
        display: flex;
        width: 28.609px;
        height: 28.609px;
        padding: 3.576px 3.577px 3.576px 3.576px;
        justify-content: center;
        align-items: center;
    }
</style>