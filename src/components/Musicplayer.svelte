<script>
    import Queue from "./Queue.svelte";
    import AddSong from "./AddSong.svelte";
    import { formatTime } from "../lib/songProcessor";
    import {currentSong, songs, totalSongs, playActive, selectedSongsFromQueue} from "../store/stores";
    import QueueOptions from "./QueueOptions.svelte";
    $:queue = $songs
    let timeline = 0
    let audio = 0;
    let count = 0;
    let audioLevel;
    let timelineSlider;
    let timeInterval;
    let repeat = false;
    let play = true;
    let previousSongs = [];
    let current;
    const progressScript = () => {
        if($playActive === true){
            count = Math.round((timeline/100) * $currentSong.duration)
            timeline = ((count/$currentSong.duration) * 100)
        }
        timelineSlider.style.background = `linear-gradient(to right, #1BD760 ${timeline}%, rgba(255, 255, 255, 0.10) ${timeline}%)`;
        timelineSlider.style.transition = 'all .3s ease'
    }
    const audioChange = () => {
        audioLevel.style.background = `linear-gradient(to right, #1BD760 ${audio}%, rgba(255, 255, 255, 0.10) ${audio}%)`;
    }
    const next = () => {
        count = 0
        timeline = 0
        progressScript()
        clearInterval(timeInterval); 
        playActive.set(false)
        playSong()
    }
    const previous = () => {
        count = 0
        timeline = 0
        clearInterval(timeInterval); 
        playActive.set(false)
        let item = previousSongs.shift()
        if(current !== item){
            queue.unshift(current);
            addQueueId()
        }
        queue.unshift(item);
        addQueueId()
        playSong()
        if(previousSongs.length > 1){
            previousSongs.shift()
        }
    }
    function onSongEnd() {
        clearInterval(timeInterval); 
        playActive.set(false)
        count = 0
        timeline = 0
        currentSong.set({})
        // current = {}
        if(repeat){
            playSong()
        } else {
            next()
        }
    }
    const continuePlay = () => {
        playSong()
        play = true
    }
    const pauseSong = () => {
        play = false;
        clearInterval(timeInterval);
        playActive.set(false)
    }
    const putOnRepeat = () => {
        repeat = !repeat;
    }
    const playSong = () => {
        if(queue.length > 0 || !play){
            if(!$playActive){
                if (!play){
                    current = current
                } else if (repeat){
                    current = current
                } else if(play && !repeat){
                    current = queue.shift()
                } else {
                    current = current
                }
                previousSongs.unshift(current);
                songs.set(queue)
                playActive.set(true)
                currentSong.set({
                    title: current.title,
                    thumbnailUrl: current.thumbnailUrl,
                    duration: current.duration,
                    id: current.id,
                    url: current.url
                })
                timeInterval = setInterval(function () {
                    count++;
                    timeline = ((count/$currentSong.duration) * 100)
                    progressScript()
                    if(count >= $currentSong.duration){
                        onSongEnd()
                    }
                }, 1000);
            }
        }
    }
const playSelected = (item) => {
    count = 0
    timeline = 0
    clearInterval(timeInterval);
    let selectedItem = queue.filter((s) => s.id === item);
    queue = queue.filter((s) => s.id !== item);
    queue.unshift(selectedItem[0]);
    addQueueId();
    playActive.set(false)
    playSong()
}
const addQueueId = () => {
    let itemsWithQueueId = queue.map((item, index) => {
        return {queueId : index + 1, ...item}
    })
    songs.set(itemsWithQueueId);
}
function addToQueue(songUrl, duration, title, thumbnailUrl, id) {
    queue.push({ url: songUrl, duration: duration, title: title, thumbnailUrl: thumbnailUrl, id: id });
    addQueueId()
    totalSongs.set(queue.length)
}
const removeSong = () => {
    $selectedSongsFromQueue.map((s) => {
        queue = queue.filter((i) => i.id !== s)
    })
    songs.set(queue)
    addQueueId()
    selectedSongsFromQueue.set([])
}
</script>

<div class="container">
    <div class="purple-bg"></div>
    <section>
        <svg class="bg-svg" xmlns="http://www.w3.org/2000/svg" width="210" height="188" viewBox="0 0 210 188" fill="none">
            <path opacity="0.18" fill-rule="evenodd" clip-rule="evenodd" d="M260.351 16.3279C261.158 17.5744 261.676 18.986 261.866 20.4588C262.057 21.9317 261.915 23.4285 261.451 24.8393L214.765 167.079C212.637 173.552 208.358 179.102 202.638 182.806C196.918 186.509 190.103 188.143 183.326 187.436L155.784 184.564C148.031 183.756 140.916 179.9 136.005 173.845C131.095 167.791 128.791 160.033 129.6 152.28C130.408 144.526 134.264 137.412 140.319 132.501C146.373 127.591 154.131 125.286 161.884 126.095L197.804 129.846C200.065 130.081 202.339 129.534 204.246 128.296C206.154 127.058 207.579 125.204 208.285 123.043L226.306 68.1371L118.362 56.8518L86.5875 153.661C84.4638 160.14 80.1848 165.696 74.463 169.405C68.7411 173.113 61.9217 174.75 55.14 174.042L27.5938 171.142C23.6676 170.855 19.839 169.782 16.3355 167.986C12.832 166.191 9.72491 163.71 7.19881 160.691C4.6727 157.671 2.77908 154.175 1.63035 150.41C0.481622 146.644 0.101216 142.687 0.511742 138.771C0.922263 134.856 2.11533 131.063 4.02011 127.618C5.92488 124.173 8.50253 121.145 11.6 118.716C14.6974 116.286 18.2515 114.504 22.0513 113.474C25.851 112.444 29.8188 112.189 33.7192 112.723L69.5929 116.486C71.8514 116.724 74.1233 116.182 76.0309 114.949C77.9384 113.717 79.3667 111.869 80.0783 109.712L114.371 5.23049C115.079 3.07226 116.505 1.2215 118.411 -0.0139868C120.317 -1.24948 122.589 -1.79524 124.848 -1.56053L253.03 11.8455C254.507 11.9985 255.932 12.4805 257.199 13.2561C258.466 14.0318 259.543 15.0814 260.351 16.3279Z" fill="white"/>
        </svg>
        <header>Music Player</header>
        <AddSong {playSong} {addToQueue}/>
        <div class="music-controls">
            <img class="music-cover" src={$currentSong.thumbnailUrl} alt="">
            <h4> {$currentSong.title ? $currentSong.title : ""}</h4>
            <div>
                <div class="full-timeline">
                    <input type="range" name="" id="" min="0" max="100" bind:value={timeline} bind:this={timelineSlider} class="slider timeline-slider" on:input={progressScript}>
                </div>

                <div class="time">
                    <p class="current-time">{formatTime(count)}</p>
                    <p class="full-time">{formatTime($currentSong.duration ? $currentSong.duration : 0)}</p>
                </div>
            </div>
            <div class="flex-between">
                <div class="controls">
                    <svg class="previous" on:click={previous} on:keydown={() => {}} xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                        <path d="M2.65769 8.30309C1.67534 8.88559 1.67534 10.3074 2.65769 10.8899L11.4445 16.1001C12.4469 16.6945 13.7151 15.972 13.7151 14.8067L13.7151 4.38634C13.7151 3.22101 12.4469 2.49856 11.4445 3.09292L2.65769 8.30309Z"/>
                        <rect width="2.38536" height="14.209" rx="1.19268" transform="matrix(-1 0 0 1 2.38544 2.4921)"/>
                    </svg>

                    {#if !play}
                    <svg class="play" on:click={continuePlay} on:keydown={() => {}} xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                        <path d="M15.4701 7.77096C16.4524 8.35345 16.4524 9.77531 15.4701 10.3578L6.68325 15.568C5.68088 16.1623 4.4126 15.4399 4.4126 14.2746L4.4126 3.85421C4.4126 2.68887 5.68088 1.96643 6.68325 2.56078L15.4701 7.77096Z"/>
                    </svg>
                        {:else}
                        <svg class="pause" on:click={pauseSong} on:keydown={() => {}} xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                            <rect x="3.021" y="2.26611" width="3.77682" height="14.3519" rx="1.51073"/>
                            <rect x="12.0854" y="2.26611" width="3.77682" height="14.3519" rx="1.51073"/>
                        </svg>
                    {/if}

                    <svg class="next" on:click={next} on:keydown={() => {}} xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                        <path d="M15.4701 7.77096C16.4524 8.35345 16.4524 9.77531 15.4701 10.3578L6.68325 15.568C5.68088 16.1623 4.4126 15.4399 4.4126 14.2746L4.4126 3.85421C4.4126 2.68887 5.68088 1.96643 6.68325 2.56078L15.4701 7.77096Z"/>
                        <rect x="15.7422" y="1.96033" width="2.38536" height="14.209" rx="1.19268"/>
                    </svg>

                    <svg class="repeat" on:click={putOnRepeat} on:keydown={() => {}} class:repeat-active={repeat} xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                        <path d="M10.6507 2.26611L12.6902 4.3056M12.6902 4.3056L10.6507 6.34508M12.6902 4.3056H7.7954C6.65318 4.3056 6.08207 4.3056 5.6458 4.52789C5.26205 4.72342 4.95005 5.03542 4.75452 5.41918C4.53223 5.85545 4.53223 6.42656 4.53223 7.56877V11.4438C4.53223 11.7595 4.53223 11.9174 4.54967 12.0499C4.67016 12.9651 5.39032 13.6853 6.30551 13.8057C6.43804 13.8232 6.5959 13.8232 6.91163 13.8232M9.97085 13.8232H14.8656C16.0078 13.8232 16.5789 13.8232 17.0152 13.6009C17.399 13.4054 17.711 13.0934 17.9065 12.7096C18.1288 12.2733 18.1288 11.7022 18.1288 10.56V6.685C18.1288 6.36927 18.1288 6.21141 18.1113 6.07888C17.9909 5.16369 17.2707 4.44353 16.3555 4.32305C16.223 4.3056 16.0651 4.3056 15.7494 4.3056M9.97085 13.8232L12.0103 15.8627M9.97085 13.8232L12.0103 11.7837" stroke-width="1.51073" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="volume">
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                        <path d="M11.1067 2.59999C11.2509 2.7707 11.3302 2.98674 11.3302 3.21033V14.92C11.3303 15.1001 11.2788 15.2765 11.1818 15.4283C11.0849 15.5801 10.9466 15.7011 10.7831 15.7768C10.6197 15.8526 10.438 15.88 10.2595 15.8559C10.081 15.8317 9.91314 15.757 9.7757 15.6406L6.0238 12.4635H3.21007C2.75931 12.4635 2.32702 12.2845 2.00829 11.9658C1.68956 11.647 1.5105 11.2147 1.5105 10.764V7.36483C1.5105 6.91408 1.68956 6.48179 2.00829 6.16306C2.32702 5.84432 2.75931 5.66526 3.21007 5.66526H6.0238L9.77646 2.48971C9.96761 2.32813 10.2151 2.24906 10.4645 2.26988C10.714 2.2907 10.9449 2.40971 11.1067 2.60075V2.59999ZM12.9195 6.52638C13.0478 6.44836 13.2017 6.42442 13.3476 6.45983C13.4935 6.49523 13.6194 6.58709 13.6976 6.71522C14.1311 7.42526 14.3487 8.21991 14.3487 9.08706C14.3487 9.95498 14.1311 10.7496 13.6976 11.4597C13.6599 11.5253 13.6095 11.5827 13.5492 11.6286C13.489 11.6744 13.4202 11.7077 13.3469 11.7265C13.2736 11.7453 13.1972 11.7492 13.1224 11.738C13.0475 11.7269 12.9757 11.7008 12.9111 11.6614C12.8465 11.6219 12.7904 11.57 12.7462 11.5085C12.702 11.4471 12.6706 11.3774 12.6538 11.3036C12.637 11.2298 12.6351 11.1534 12.6483 11.0789C12.6615 11.0044 12.6895 10.9332 12.7307 10.8697C13.054 10.3395 13.2156 9.74952 13.2156 9.08706C13.2156 8.42536 13.054 7.83543 12.7307 7.30516C12.6527 7.17692 12.6287 7.02295 12.6641 6.87708C12.6995 6.7312 12.7914 6.60458 12.9195 6.52638Z" fill='white'/>
                    </svg>
                    <div class="full-volume flex-between">
                        <input type="range" name="" id="" min="0" max="100" bind:value={audio} bind:this={audioLevel} class="slider" on:input={audioChange}>
                    </div>
                </div>
            </div>
        </div>
       <Queue/>
    </section>
</div>
{#if $selectedSongsFromQueue.length > 0}
        <QueueOptions {playSelected} {removeSong}/>
{/if}

<style>
    .container{
        height: 667px;
        overflow-y: scroll;
        position: relative;
    }
    section{
        padding: 60px 22px 0 22px;
        position: relative;
        font-family: 'SF Pro Text';
        line-height: normal;
        font-style: normal;
        padding-bottom: 85px;
    }
    .purple-bg{
        width: 100%;
        height: 304px;
        background: #6E1BD7;
        position: absolute;
        z-index: -1;
        top: 0;
        left: 0;
    }
    header{
        text-shadow: 0px 0px 25px rgba(255, 255, 255, 0.35);
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 18px;
    }
    .bg-svg{
        top: 0;
        right: 0;
        position: absolute;
        z-index: -1;
    }
    .music-controls{
        border-radius: 17px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: #121212;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        color: white;
        font-family: 'SF Pro Text';
        font-style: normal;
    }
    .music-cover{
        width: 100%;
        height: 128px;
        border-top-right-radius: 8px;
        border-top-left-radius: 8px;
    }
    h4{
        text-transform: capitalize;
        font-size: 14px;
        font-weight: 700;
        line-height: 122%;
    }
    .full-timeline, .full-volume{
        width: 100%;
        margin-bottom: 12px;
    }
    .full-volume{
        width: 68px;
        margin-bottom: 0;
    }
    .time{
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: rgba(255, 255, 255, 0.50);
        font-size: 12px;
        font-weight: 700;
        line-height: 100%; /* 12px */
        text-transform: uppercase;
    }
    .controls{
        display: flex;
        align-items: center;
        gap: 12.09px;
    }
    .controls svg {
        fill:white;
        transition: all .2s ease;
        cursor: pointer;
    }
    .controls svg:hover {
        fill: #1BD760;
    }
    .repeat{
        fill: none !important;
        stroke: white;
    }
    .repeat:hover, .repeat-active{
        stroke: #1BD760;
        fill: none !important;
    }
    .volume{
        display: flex;
        align-items: center;
        gap: 6.03px;
    }
    .slider:hover::-webkit-slider-thumb{
        opacity: 1 !important;
    }
</style>