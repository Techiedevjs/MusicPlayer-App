<script>
    import { selectedSongsFromQueue} from '../store/stores';
    $:selected=$selectedSongsFromQueue
    export let song;
    export let handleDragEnd;
    export let handleDragOver;
    export let handleDragStart;
    export let index;
    let clicked;
    const handleclick = (id) => {
         clicked = !clicked
        if(selected.includes(id)){
            selectedSongsFromQueue.set(selected.filter(i => i !== id))
        } else {
            selectedSongsFromQueue.update(arr => [...arr, id] )
        }
    }
</script>

<section class="flex-between"
draggable="true"
on:dragstart={() => handleDragStart(index)}
on:dragover={(event) => handleDragOver(event, index)}
on:dragend={handleDragEnd}
>
    <div class:select={!clicked} on:click={() => handleclick(song.id)} on:keydown={() => {}} class:clicked={clicked}>
        {#if clicked}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
            <rect x="0.5" y="0.66095" width="17" height="17" rx="8.5" fill="#1BD760"/>
            <path d="M7.66995 10.7496L12.0148 6.40479C12.1773 6.24223 12.3842 6.16095 12.6355 6.16095C12.8867 6.16095 13.0936 6.24223 13.2562 6.40479C13.4187 6.56735 13.5 6.77425 13.5 7.02548C13.5 7.27671 13.4187 7.48361 13.2562 7.64617L8.29064 12.6117C8.1133 12.789 7.9064 12.8777 7.66995 12.8777C7.4335 12.8777 7.2266 12.789 7.04926 12.6117L4.74384 10.3063C4.58128 10.1437 4.5 9.93681 4.5 9.68558C4.5 9.43435 4.58128 9.22745 4.74384 9.06489C4.9064 8.90233 5.1133 8.82105 5.36453 8.82105C5.61576 8.82105 5.82266 8.90233 5.98522 9.06489L7.66995 10.7496Z" fill="black"/>
            <rect x="0.5" y="0.66095" width="17" height="17" rx="8.5" stroke="#1BD760"/>
        </svg>
        {/if}
    </div>
    <p class="pointer" on:click={() => handleclick(song.id)} on:keydown={() => {}}>
        {song.title.substring(0,25)}...
    </p>
    <svg class="drag-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="13" viewBox="0 0 16 13" fill="none">
        <rect y="0.16095" width="16" height="2" rx="1" fill="white" fill-opacity="0.5"/>
        <rect y="5.16095" width="16" height="2" rx="1" fill="white" fill-opacity="0.5"/>
        <rect y="10.1609" width="16" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    </svg>
</section>

<style>
    section{
        gap: 16px;
        cursor: pointer;
    }
    .select{
        width: 16px;
        height: 16px;
        border-radius: 30px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        cursor: pointer;
        transition: all .3s ease;
    }
    p{
        flex: 1;
        font-family: 'Outfit';
        font-size: 14px;
        font-style: normal;
        font-weight: 600;
        line-height: 122%;
        text-transform: capitalize;
    }
    .flex-between:hover .select{
        border: 1px solid #1BD760;
        background: rgba(27, 215, 96, 0.20);
    }
    .drag-icon:hover rect{
        fill-opacity: 1;
    }
    .clicked{
        justify-content: center;
        align-items: center;
        display: flex;
        border: 0;
        background: 0;
        width: 16px;
        height: 16px;
        border-radius: 30px;
        overflow: hidden;
        transition: all ease .3s;
    }
</style>