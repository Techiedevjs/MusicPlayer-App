<script>
    import SongQueue from "./SongQueue.svelte";
    import EmptyQueue from "./EmptyQueue.svelte";
    import { songs, selectedSongsFromQueue } from "../store/stores"; 
    import SongsQueueList from "./SongsQueueList.svelte";
    const clearQueue = () => {
        songs.set([])
        selectedSongsFromQueue.set([])
    }
</script>

<section>
    <div class="flex-between mb">
        <h4>Up Next</h4>
        <button class="transparent-btn" on:click={clearQueue}>CLEAR QUEUE</button>
    </div>
    <div class="flex-between">
        <p></p>
        <svg xmlns="http://www.w3.org/2000/svg" width="33" height="34" viewBox="0 0 33 34" fill="none">
            <rect x="0.25" y="0.66095" width="32.5" height="32.5" rx="16.25" fill="white" fill-opacity="0.15"/>
            <path d="M21.375 15.0508L16.5 10.1758L11.625 15.0508" stroke="white" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21.375 21.786L16.5 16.9109L11.625 21.786" stroke="white" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p></p>
    </div>
    {#if $songs.length > 0}
        <SongsQueueList/>
        {:else}
        <EmptyQueue/>
    {/if}
    
</section>

<style>
    section{
        margin-top: 32px;
        font-family: 'SF Pro Text';
        font-style: normal;
        line-height: 100%;
    }
    .mb{
        margin-bottom: 20px;
    }
    .flex-between{
        gap: 12px;
    }
    .flex-between p{
        flex: 1;
        height: 1px;
        border-radius: 33px;
        background: rgba(255, 255, 255, 0.14);
    }
    h4{
        text-shadow: 0px 0px 25px rgba(255, 255, 255, 0.35);
        font-size: 22px;
        font-weight: 700;
    }
</style>    