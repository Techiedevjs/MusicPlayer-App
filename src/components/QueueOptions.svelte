<script>
    import { selectedSongsFromQueue } from "../store/stores";
    $:selected = $selectedSongsFromQueue
    export let playSelected;
    export let removeSong;
    const playNow = () => {
        if(selected.length === 1){
            playSelected(selected[0])
            selectedSongsFromQueue.set([])
        }
    }
</script>

<div>
    <button class="transparent-btn" on:click={removeSong}>REMOVE</button>
    <button class="add" on:click={playNow}>PLAY NOW</button>
</div>

<style>
    div{
        position: absolute;
        bottom: 0;
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        padding: 0 21px;
        gap: 8px;
        padding-top: 20px;
        padding-bottom: 32px;
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        background: #121212;
    }
    .add{
        border-radius: 100px;
        border: 1px solid #1BD760;
        background: #1BD760;
        color: #121212;
        font-family: 'SF Pro Text';
        font-size: 11px;
        font-style: normal;
        font-weight: 700;
        line-height: 100%; /* 11px */
        letter-spacing: 0.44px;
        text-transform: capitalize;
        padding: 12px;
    }
    .add:hover{
        opacity: 0.9;
    }
</style>