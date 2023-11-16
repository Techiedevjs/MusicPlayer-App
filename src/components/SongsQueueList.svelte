<script>
    import SongQueue from "./SongQueue.svelte";
    import { songs } from "../store/stores"; 
    $:allsongs = $songs
    let draggedItem = null;
    let dragStartIndex = null;
    function handleDragStart(index) {
        draggedItem = allsongs[index];
        dragStartIndex = index;
    }

    function handleDragOver(event, index) {
        event.preventDefault();
        if (draggedItem && dragStartIndex !== index) {
        const updatedItems = [...allsongs];
        updatedItems.splice(dragStartIndex, 1);
        updatedItems.splice(index, 0, draggedItem);
        allsongs = updatedItems;
        dragStartIndex = index;
        }
    }

    function handleDragEnd() {
        draggedItem = null;
        dragStartIndex = null;
        let itemsWithQueueId = allsongs.map((item, index) => {
            return {queueId : index + 1, ...item}
        })
        songs.set(itemsWithQueueId);
    }
</script>

<div class="songlist">
    {#each allsongs as song, index (song.queueId)}
        <SongQueue {song} {handleDragEnd} {handleDragOver} {handleDragStart} {index}/>
    {/each}
</div>

<style>
    .songlist{
        display: flex;
        gap: 24px;
        flex-direction: column;
        margin: 24px 0;
    }
</style>