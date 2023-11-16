export function draggable(node, data){
    let state = data;
    node.draggable = true;
    node.style.cursor = 'grabbing'
}