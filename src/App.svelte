<script>
    import Musicplayer from "./components/Musicplayer.svelte";
</script>

<main class="app">
    <Musicplayer/>
</main>

<style>
    main {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) !important;
        height: 667px;
        aspect-ratio: 313/667;
        background: #121212;
        background-repeat: no-repeat;
        background-size: cover;
        border-radius: 45px;
        font-family: "SF Pro Text";
        font-style: normal;
        color: #ffffff;
        overflow: hidden;
    }
    
</style>
