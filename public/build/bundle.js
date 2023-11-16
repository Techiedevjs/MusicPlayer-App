
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const apiKey = "AIzaSyAZBDyql6dUFTy5ycIywsqPfOE92O3tEhk";
    const songs = writable([]);
    const selectedSongsFromQueue = writable([]);
    const currentSong = writable({});
    const totalSongs = writable(0);
    const playActive = writable(false);

    /* src\components\SongQueue.svelte generated by Svelte v3.59.2 */
    const file$7 = "src\\components\\SongQueue.svelte";

    // (27:8) {#if clicked}
    function create_if_block$2(ctx) {
    	let svg;
    	let rect0;
    	let path;
    	let rect1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect0 = svg_element("rect");
    			path = svg_element("path");
    			rect1 = svg_element("rect");
    			attr_dev(rect0, "x", "0.5");
    			attr_dev(rect0, "y", "0.66095");
    			attr_dev(rect0, "width", "17");
    			attr_dev(rect0, "height", "17");
    			attr_dev(rect0, "rx", "8.5");
    			attr_dev(rect0, "fill", "#1BD760");
    			add_location(rect0, file$7, 28, 12, 996);
    			attr_dev(path, "d", "M7.66995 10.7496L12.0148 6.40479C12.1773 6.24223 12.3842 6.16095 12.6355 6.16095C12.8867 6.16095 13.0936 6.24223 13.2562 6.40479C13.4187 6.56735 13.5 6.77425 13.5 7.02548C13.5 7.27671 13.4187 7.48361 13.2562 7.64617L8.29064 12.6117C8.1133 12.789 7.9064 12.8777 7.66995 12.8777C7.4335 12.8777 7.2266 12.789 7.04926 12.6117L4.74384 10.3063C4.58128 10.1437 4.5 9.93681 4.5 9.68558C4.5 9.43435 4.58128 9.22745 4.74384 9.06489C4.9064 8.90233 5.1133 8.82105 5.36453 8.82105C5.61576 8.82105 5.82266 8.90233 5.98522 9.06489L7.66995 10.7496Z");
    			attr_dev(path, "fill", "black");
    			add_location(path, file$7, 29, 12, 1084);
    			attr_dev(rect1, "x", "0.5");
    			attr_dev(rect1, "y", "0.66095");
    			attr_dev(rect1, "width", "17");
    			attr_dev(rect1, "height", "17");
    			attr_dev(rect1, "rx", "8.5");
    			attr_dev(rect1, "stroke", "#1BD760");
    			add_location(rect1, file$7, 30, 12, 1655);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "18");
    			attr_dev(svg, "height", "19");
    			attr_dev(svg, "viewBox", "0 0 18 19");
    			attr_dev(svg, "fill", "none");
    			add_location(svg, file$7, 27, 8, 887);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect0);
    			append_dev(svg, path);
    			append_dev(svg, rect1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(27:8) {#if clicked}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let section;
    	let div;
    	let t0;
    	let p;
    	let t1_value = /*song*/ ctx[0].title.substring(0, 25) + "";
    	let t1;
    	let t2;
    	let t3;
    	let svg;
    	let rect0;
    	let rect1;
    	let rect2;
    	let mounted;
    	let dispose;
    	let if_block = /*clicked*/ ctx[5] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = text("...");
    			t3 = space();
    			svg = svg_element("svg");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			attr_dev(div, "class", "svelte-1uvjoeq");
    			toggle_class(div, "select", !/*clicked*/ ctx[5]);
    			toggle_class(div, "clicked", /*clicked*/ ctx[5]);
    			add_location(div, file$7, 25, 4, 741);
    			attr_dev(p, "class", "pointer svelte-1uvjoeq");
    			add_location(p, file$7, 34, 4, 1780);
    			attr_dev(rect0, "y", "0.16095");
    			attr_dev(rect0, "width", "16");
    			attr_dev(rect0, "height", "2");
    			attr_dev(rect0, "rx", "1");
    			attr_dev(rect0, "fill", "white");
    			attr_dev(rect0, "fill-opacity", "0.5");
    			attr_dev(rect0, "class", "svelte-1uvjoeq");
    			add_location(rect0, file$7, 38, 8, 2039);
    			attr_dev(rect1, "y", "5.16095");
    			attr_dev(rect1, "width", "16");
    			attr_dev(rect1, "height", "2");
    			attr_dev(rect1, "rx", "1");
    			attr_dev(rect1, "fill", "white");
    			attr_dev(rect1, "fill-opacity", "0.5");
    			attr_dev(rect1, "class", "svelte-1uvjoeq");
    			add_location(rect1, file$7, 39, 8, 2129);
    			attr_dev(rect2, "y", "10.1609");
    			attr_dev(rect2, "width", "16");
    			attr_dev(rect2, "height", "2");
    			attr_dev(rect2, "rx", "1");
    			attr_dev(rect2, "fill", "white");
    			attr_dev(rect2, "fill-opacity", "0.5");
    			attr_dev(rect2, "class", "svelte-1uvjoeq");
    			add_location(rect2, file$7, 40, 8, 2219);
    			attr_dev(svg, "class", "drag-icon svelte-1uvjoeq");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "13");
    			attr_dev(svg, "viewBox", "0 0 16 13");
    			attr_dev(svg, "fill", "none");
    			add_location(svg, file$7, 37, 4, 1916);
    			attr_dev(section, "class", "flex-between svelte-1uvjoeq");
    			attr_dev(section, "draggable", "true");
    			add_location(section, file$7, 19, 0, 557);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    			if (if_block) if_block.m(div, null);
    			append_dev(section, t0);
    			append_dev(section, p);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(section, t3);
    			append_dev(section, svg);
    			append_dev(svg, rect0);
    			append_dev(svg, rect1);
    			append_dev(svg, rect2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", /*click_handler*/ ctx[8], false, false, false, false),
    					listen_dev(div, "keydown", keydown_handler$1, false, false, false, false),
    					listen_dev(p, "click", /*click_handler_1*/ ctx[9], false, false, false, false),
    					listen_dev(p, "keydown", keydown_handler_1$1, false, false, false, false),
    					listen_dev(section, "dragstart", /*dragstart_handler*/ ctx[10], false, false, false, false),
    					listen_dev(section, "dragover", /*dragover_handler*/ ctx[11], false, false, false, false),
    					listen_dev(
    						section,
    						"dragend",
    						function () {
    							if (is_function(/*handleDragEnd*/ ctx[1])) /*handleDragEnd*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (/*clicked*/ ctx[5]) {
    				if (if_block) ; else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*clicked*/ 32) {
    				toggle_class(div, "select", !/*clicked*/ ctx[5]);
    			}

    			if (dirty & /*clicked*/ 32) {
    				toggle_class(div, "clicked", /*clicked*/ ctx[5]);
    			}

    			if (dirty & /*song*/ 1 && t1_value !== (t1_value = /*song*/ ctx[0].title.substring(0, 25) + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const keydown_handler$1 = () => {
    	
    };

    const keydown_handler_1$1 = () => {
    	
    };

    function instance$7($$self, $$props, $$invalidate) {
    	let selected;
    	let $selectedSongsFromQueue;
    	validate_store(selectedSongsFromQueue, 'selectedSongsFromQueue');
    	component_subscribe($$self, selectedSongsFromQueue, $$value => $$invalidate(7, $selectedSongsFromQueue = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SongQueue', slots, []);
    	let { song } = $$props;
    	let { handleDragEnd } = $$props;
    	let { handleDragOver } = $$props;
    	let { handleDragStart } = $$props;
    	let { index } = $$props;
    	let clicked;

    	const handleclick = id => {
    		$$invalidate(5, clicked = !clicked);

    		if (selected.includes(id)) {
    			selectedSongsFromQueue.set(selected.filter(i => i !== id));
    		} else {
    			selectedSongsFromQueue.update(arr => [...arr, id]);
    		}
    	};

    	$$self.$$.on_mount.push(function () {
    		if (song === undefined && !('song' in $$props || $$self.$$.bound[$$self.$$.props['song']])) {
    			console.warn("<SongQueue> was created without expected prop 'song'");
    		}

    		if (handleDragEnd === undefined && !('handleDragEnd' in $$props || $$self.$$.bound[$$self.$$.props['handleDragEnd']])) {
    			console.warn("<SongQueue> was created without expected prop 'handleDragEnd'");
    		}

    		if (handleDragOver === undefined && !('handleDragOver' in $$props || $$self.$$.bound[$$self.$$.props['handleDragOver']])) {
    			console.warn("<SongQueue> was created without expected prop 'handleDragOver'");
    		}

    		if (handleDragStart === undefined && !('handleDragStart' in $$props || $$self.$$.bound[$$self.$$.props['handleDragStart']])) {
    			console.warn("<SongQueue> was created without expected prop 'handleDragStart'");
    		}

    		if (index === undefined && !('index' in $$props || $$self.$$.bound[$$self.$$.props['index']])) {
    			console.warn("<SongQueue> was created without expected prop 'index'");
    		}
    	});

    	const writable_props = ['song', 'handleDragEnd', 'handleDragOver', 'handleDragStart', 'index'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SongQueue> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handleclick(song.id);
    	const click_handler_1 = () => handleclick(song.id);
    	const dragstart_handler = () => handleDragStart(index);
    	const dragover_handler = event => handleDragOver(event, index);

    	$$self.$$set = $$props => {
    		if ('song' in $$props) $$invalidate(0, song = $$props.song);
    		if ('handleDragEnd' in $$props) $$invalidate(1, handleDragEnd = $$props.handleDragEnd);
    		if ('handleDragOver' in $$props) $$invalidate(2, handleDragOver = $$props.handleDragOver);
    		if ('handleDragStart' in $$props) $$invalidate(3, handleDragStart = $$props.handleDragStart);
    		if ('index' in $$props) $$invalidate(4, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		selectedSongsFromQueue,
    		song,
    		handleDragEnd,
    		handleDragOver,
    		handleDragStart,
    		index,
    		clicked,
    		handleclick,
    		selected,
    		$selectedSongsFromQueue
    	});

    	$$self.$inject_state = $$props => {
    		if ('song' in $$props) $$invalidate(0, song = $$props.song);
    		if ('handleDragEnd' in $$props) $$invalidate(1, handleDragEnd = $$props.handleDragEnd);
    		if ('handleDragOver' in $$props) $$invalidate(2, handleDragOver = $$props.handleDragOver);
    		if ('handleDragStart' in $$props) $$invalidate(3, handleDragStart = $$props.handleDragStart);
    		if ('index' in $$props) $$invalidate(4, index = $$props.index);
    		if ('clicked' in $$props) $$invalidate(5, clicked = $$props.clicked);
    		if ('selected' in $$props) selected = $$props.selected;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$selectedSongsFromQueue*/ 128) {
    			selected = $selectedSongsFromQueue;
    		}
    	};

    	return [
    		song,
    		handleDragEnd,
    		handleDragOver,
    		handleDragStart,
    		index,
    		clicked,
    		handleclick,
    		$selectedSongsFromQueue,
    		click_handler,
    		click_handler_1,
    		dragstart_handler,
    		dragover_handler
    	];
    }

    class SongQueue extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			song: 0,
    			handleDragEnd: 1,
    			handleDragOver: 2,
    			handleDragStart: 3,
    			index: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SongQueue",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get song() {
    		throw new Error("<SongQueue>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set song(value) {
    		throw new Error("<SongQueue>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleDragEnd() {
    		throw new Error("<SongQueue>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleDragEnd(value) {
    		throw new Error("<SongQueue>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleDragOver() {
    		throw new Error("<SongQueue>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleDragOver(value) {
    		throw new Error("<SongQueue>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleDragStart() {
    		throw new Error("<SongQueue>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleDragStart(value) {
    		throw new Error("<SongQueue>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<SongQueue>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<SongQueue>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\EmptyQueue.svelte generated by Svelte v3.59.2 */

    const file$6 = "src\\components\\EmptyQueue.svelte";

    function create_fragment$6(ctx) {
    	let section;
    	let svg;
    	let path;
    	let t0;
    	let p;

    	const block = {
    		c: function create() {
    			section = element("section");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			p = element("p");
    			p.textContent = "Paste a URL from Youtube to play music";
    			attr_dev(path, "d", "M18.5993 35.683V1.99999M27.02 29.3674V8.31554M10.1786 29.3674V8.31554M1.75781 20.9467V16.7363M35.2422 20.9467V16.7363");
    			attr_dev(path, "stroke", "#1BD760");
    			attr_dev(path, "stroke-width", "3.5");
    			attr_dev(path, "stroke-linecap", "round");
    			add_location(path, file$6, 6, 8, 145);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "37");
    			attr_dev(svg, "height", "38");
    			attr_dev(svg, "viewBox", "0 0 37 38");
    			attr_dev(svg, "fill", "none");
    			add_location(svg, file$6, 5, 4, 40);
    			attr_dev(p, "class", "svelte-vn9y9r");
    			add_location(p, file$6, 8, 4, 351);
    			attr_dev(section, "class", "svelte-vn9y9r");
    			add_location(section, file$6, 4, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, svg);
    			append_dev(svg, path);
    			append_dev(section, t0);
    			append_dev(section, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('EmptyQueue', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EmptyQueue> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class EmptyQueue extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EmptyQueue",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\SongsQueueList.svelte generated by Svelte v3.59.2 */
    const file$5 = "src\\components\\SongsQueueList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (34:4) {#each allsongs as song, index (song.queueId)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let songqueue;
    	let current;

    	songqueue = new SongQueue({
    			props: {
    				song: /*song*/ ctx[7],
    				handleDragEnd: /*handleDragEnd*/ ctx[3],
    				handleDragOver: /*handleDragOver*/ ctx[2],
    				handleDragStart: /*handleDragStart*/ ctx[1],
    				index: /*index*/ ctx[9]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(songqueue.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(songqueue, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const songqueue_changes = {};
    			if (dirty & /*allsongs*/ 1) songqueue_changes.song = /*song*/ ctx[7];
    			if (dirty & /*allsongs*/ 1) songqueue_changes.index = /*index*/ ctx[9];
    			songqueue.$set(songqueue_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(songqueue.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(songqueue.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(songqueue, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(34:4) {#each allsongs as song, index (song.queueId)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*allsongs*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*song*/ ctx[7].queueId;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "songlist svelte-1vntsi4");
    			add_location(div, file$5, 32, 0, 959);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*allsongs, handleDragEnd, handleDragOver, handleDragStart*/ 15) {
    				each_value = /*allsongs*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, null, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let allsongs;
    	let $songs;
    	validate_store(songs, 'songs');
    	component_subscribe($$self, songs, $$value => $$invalidate(4, $songs = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SongsQueueList', slots, []);
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
    			$$invalidate(0, allsongs = updatedItems);
    			dragStartIndex = index;
    		}
    	}

    	function handleDragEnd() {
    		draggedItem = null;
    		dragStartIndex = null;

    		let itemsWithQueueId = allsongs.map((item, index) => {
    			return { queueId: index + 1, ...item };
    		});

    		songs.set(itemsWithQueueId);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SongsQueueList> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		SongQueue,
    		songs,
    		draggedItem,
    		dragStartIndex,
    		handleDragStart,
    		handleDragOver,
    		handleDragEnd,
    		allsongs,
    		$songs
    	});

    	$$self.$inject_state = $$props => {
    		if ('draggedItem' in $$props) draggedItem = $$props.draggedItem;
    		if ('dragStartIndex' in $$props) dragStartIndex = $$props.dragStartIndex;
    		if ('allsongs' in $$props) $$invalidate(0, allsongs = $$props.allsongs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$songs*/ 16) {
    			$$invalidate(0, allsongs = $songs);
    		}
    	};

    	return [allsongs, handleDragStart, handleDragOver, handleDragEnd, $songs];
    }

    class SongsQueueList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SongsQueueList",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\Queue.svelte generated by Svelte v3.59.2 */
    const file$4 = "src\\components\\Queue.svelte";

    // (28:8) {:else}
    function create_else_block$1(ctx) {
    	let emptyqueue;
    	let current;
    	emptyqueue = new EmptyQueue({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(emptyqueue.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(emptyqueue, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(emptyqueue.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(emptyqueue.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(emptyqueue, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(28:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (26:4) {#if $songs.length > 0}
    function create_if_block$1(ctx) {
    	let songsqueuelist;
    	let current;
    	songsqueuelist = new SongsQueueList({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(songsqueuelist.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(songsqueuelist, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(songsqueuelist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(songsqueuelist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(songsqueuelist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(26:4) {#if $songs.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let section;
    	let div0;
    	let h4;
    	let t1;
    	let button;
    	let t3;
    	let div1;
    	let p0;
    	let t4;
    	let svg;
    	let rect;
    	let path0;
    	let path1;
    	let t5;
    	let p1;
    	let t6;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$songs*/ ctx[0].length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Up Next";
    			t1 = space();
    			button = element("button");
    			button.textContent = "CLEAR QUEUE";
    			t3 = space();
    			div1 = element("div");
    			p0 = element("p");
    			t4 = space();
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t5 = space();
    			p1 = element("p");
    			t6 = space();
    			if_block.c();
    			attr_dev(h4, "class", "svelte-142uzw4");
    			add_location(h4, file$4, 13, 8, 409);
    			attr_dev(button, "class", "transparent-btn");
    			add_location(button, file$4, 14, 8, 435);
    			attr_dev(div0, "class", "flex-between mb svelte-142uzw4");
    			add_location(div0, file$4, 12, 4, 370);
    			attr_dev(p0, "class", "svelte-142uzw4");
    			add_location(p0, file$4, 17, 8, 563);
    			attr_dev(rect, "x", "0.25");
    			attr_dev(rect, "y", "0.66095");
    			attr_dev(rect, "width", "32.5");
    			attr_dev(rect, "height", "32.5");
    			attr_dev(rect, "rx", "16.25");
    			attr_dev(rect, "fill", "white");
    			attr_dev(rect, "fill-opacity", "0.15");
    			add_location(rect, file$4, 19, 12, 689);
    			attr_dev(path0, "d", "M21.375 15.0508L16.5 10.1758L11.625 15.0508");
    			attr_dev(path0, "stroke", "white");
    			attr_dev(path0, "stroke-width", "1.95");
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			add_location(path0, file$4, 20, 12, 802);
    			attr_dev(path1, "d", "M21.375 21.786L16.5 16.9109L11.625 21.786");
    			attr_dev(path1, "stroke", "white");
    			attr_dev(path1, "stroke-width", "1.95");
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			add_location(path1, file$4, 21, 12, 953);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "33");
    			attr_dev(svg, "height", "34");
    			attr_dev(svg, "viewBox", "0 0 33 34");
    			attr_dev(svg, "fill", "none");
    			add_location(svg, file$4, 18, 8, 580);
    			attr_dev(p1, "class", "svelte-142uzw4");
    			add_location(p1, file$4, 23, 8, 1114);
    			attr_dev(div1, "class", "flex-between svelte-142uzw4");
    			add_location(div1, file$4, 16, 4, 527);
    			attr_dev(section, "class", "svelte-142uzw4");
    			add_location(section, file$4, 11, 0, 355);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, h4);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(section, t3);
    			append_dev(section, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t4);
    			append_dev(div1, svg);
    			append_dev(svg, rect);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(div1, t5);
    			append_dev(div1, p1);
    			append_dev(section, t6);
    			if_blocks[current_block_type_index].m(section, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*clearQueue*/ ctx[1], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(section, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $songs;
    	validate_store(songs, 'songs');
    	component_subscribe($$self, songs, $$value => $$invalidate(0, $songs = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Queue', slots, []);

    	const clearQueue = () => {
    		songs.set([]);
    		selectedSongsFromQueue.set([]);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Queue> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		SongQueue,
    		EmptyQueue,
    		songs,
    		selectedSongsFromQueue,
    		SongsQueueList,
    		clearQueue,
    		$songs
    	});

    	return [$songs, clearQueue];
    }

    class Queue extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Queue",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    function convertTime(duration) {
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

    function getVideoId(url) {
        var video_id = url.split('v=')[1];
        var ampersandPosition = video_id.indexOf('&');
        if (ampersandPosition != -1) {
            video_id = video_id.substring(0, ampersandPosition);
        }
        return video_id;
    }

    function formatTime(seconds) {
        var minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }

    /* src\components\AddSong.svelte generated by Svelte v3.59.2 */

    const { Error: Error_1, console: console_1 } = globals;
    const file$3 = "src\\components\\AddSong.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let svg;
    	let path;
    	let t0;
    	let p;
    	let input;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			p = element("p");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = "ADD SONG";
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M16.4346 3.98642C16.5073 4.04512 16.566 4.11937 16.6063 4.20372C16.6466 4.28807 16.6675 4.38037 16.6674 4.47384V13.8968C16.6672 14.3257 16.5202 14.7416 16.2508 15.0754C15.9815 15.4091 15.606 15.6406 15.1868 15.7313L13.4833 16.1003C13.0037 16.2041 12.5026 16.1131 12.0901 15.8474C11.6775 15.5817 11.3875 15.163 11.2836 14.6835C11.1798 14.2039 11.2708 13.7027 11.5365 13.2902C11.8022 12.8777 12.2209 12.5876 12.7004 12.4838L14.9222 12.0031C15.0621 11.9727 15.1873 11.8954 15.2771 11.7839C15.3668 11.6724 15.4157 11.5335 15.4155 11.3904V7.75311L8.73844 9.19702V15.6103C8.73861 16.0395 8.59178 16.4558 8.32238 16.7899C8.05298 17.124 7.67727 17.3557 7.2578 17.4465L5.55348 17.8138C5.31304 17.8737 5.06302 17.8846 4.81825 17.846C4.57349 17.8074 4.33897 17.7201 4.12863 17.5891C3.91829 17.4581 3.73642 17.2862 3.59381 17.0835C3.4512 16.8809 3.35076 16.6517 3.29846 16.4095C3.24616 16.1673 3.24306 15.917 3.28935 15.6736C3.33564 15.4301 3.43037 15.1985 3.56791 14.9924C3.70546 14.7863 3.88303 14.6099 4.09006 14.4738C4.29709 14.3376 4.52937 14.2444 4.7731 14.1998L6.99239 13.7207C7.13213 13.6906 7.25735 13.6136 7.34724 13.5024C7.43713 13.3913 7.48627 13.2527 7.48649 13.1098V6.18818C7.48648 6.0452 7.53541 5.90653 7.62515 5.79523C7.7149 5.68393 7.84003 5.6067 7.97976 5.57639L15.9088 3.86206C16.0001 3.8422 16.0948 3.84306 16.1858 3.86458C16.2768 3.8861 16.3618 3.92773 16.4346 3.98642Z");
    			attr_dev(path, "fill", "#121212");
    			add_location(path, file$3, 56, 12, 1773);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "23");
    			attr_dev(svg, "height", "22");
    			attr_dev(svg, "viewBox", "0 0 23 22");
    			attr_dev(svg, "fill", "none");
    			add_location(svg, file$3, 55, 8, 1664);
    			attr_dev(div0, "class", "icon svelte-115yxu0");
    			add_location(div0, file$3, 54, 4, 1636);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "");
    			attr_dev(input, "id", "");
    			attr_dev(input, "placeholder", "Enter song URL");
    			attr_dev(input, "class", "svelte-115yxu0");
    			add_location(input, file$3, 59, 7, 3256);
    			attr_dev(p, "class", "svelte-115yxu0");
    			add_location(p, file$3, 59, 4, 3253);
    			attr_dev(button, "class", "svelte-115yxu0");
    			add_location(button, file$3, 60, 4, 3400);
    			attr_dev(div1, "class", "link-cont svelte-115yxu0");
    			toggle_class(div1, "border", /*songlink*/ ctx[0]);
    			add_location(div1, file$3, 53, 0, 1561);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path);
    			append_dev(div1, t0);
    			append_dev(div1, p);
    			append_dev(p, input);
    			set_input_value(input, /*songlink*/ ctx[0]);
    			append_dev(div1, t1);
    			append_dev(div1, button);
    			/*div1_binding*/ ctx[8](div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(input, "focus", /*applyBorder*/ ctx[3], false, false, false, false),
    					listen_dev(input, "focusout", /*removeBorder*/ ctx[4], false, false, false, false),
    					listen_dev(button, "click", /*addSong*/ ctx[2], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*songlink*/ 1 && input.value !== /*songlink*/ ctx[0]) {
    				set_input_value(input, /*songlink*/ ctx[0]);
    			}

    			if (dirty & /*songlink*/ 1) {
    				toggle_class(div1, "border", /*songlink*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*div1_binding*/ ctx[8](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AddSong', slots, []);
    	let songlink;
    	let { addToQueue } = $$props;
    	let { playSong } = $$props;
    	let songCount = 0;
    	let songinput;

    	const addSong = () => {
    		if (songlink) {
    			Process(songlink);
    			$$invalidate(0, songlink = '');
    		}
    	};

    	function getVideoDetails(videoId, callback) {
    		var apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails&id=${videoId}&key=${apiKey}`;

    		fetch(apiUrl).then(response => {
    			if (!response.ok) {
    				throw new Error('Network response was not ok');
    			}

    			return response.json();
    		}).then(data => {
    			var duration = convertTime(data.items[0].contentDetails.duration);
    			var thumbnailUrl = data.items[0].snippet.thumbnails.default.url;
    			callback(data.items[0].snippet.title, duration, thumbnailUrl);
    		}).catch(error => {
    			console.error('Error:', error);
    		});
    	}

    	function Process(songURL) {
    		if (songURL) {
    			var videoId = getVideoId(songURL);

    			getVideoDetails(videoId, function (title, duration, thumbnailUrl) {
    				if (title) {
    					addToQueue(songURL, duration, title, thumbnailUrl, songCount);
    					playSong();
    					songCount++;
    				}
    			});
    		}
    	}

    	const applyBorder = () => {
    		$$invalidate(1, songinput.style.border = '1px solid #1BD760', songinput);
    	};

    	const removeBorder = () => {
    		$$invalidate(1, songinput.style.border = '1px solid transparent', songinput);
    	};

    	$$self.$$.on_mount.push(function () {
    		if (addToQueue === undefined && !('addToQueue' in $$props || $$self.$$.bound[$$self.$$.props['addToQueue']])) {
    			console_1.warn("<AddSong> was created without expected prop 'addToQueue'");
    		}

    		if (playSong === undefined && !('playSong' in $$props || $$self.$$.bound[$$self.$$.props['playSong']])) {
    			console_1.warn("<AddSong> was created without expected prop 'playSong'");
    		}
    	});

    	const writable_props = ['addToQueue', 'playSong'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<AddSong> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		songlink = this.value;
    		$$invalidate(0, songlink);
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			songinput = $$value;
    			$$invalidate(1, songinput);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('addToQueue' in $$props) $$invalidate(5, addToQueue = $$props.addToQueue);
    		if ('playSong' in $$props) $$invalidate(6, playSong = $$props.playSong);
    	};

    	$$self.$capture_state = () => ({
    		songs,
    		apiKey,
    		getVideoId,
    		convertTime,
    		songlink,
    		addToQueue,
    		playSong,
    		songCount,
    		songinput,
    		addSong,
    		getVideoDetails,
    		Process,
    		applyBorder,
    		removeBorder
    	});

    	$$self.$inject_state = $$props => {
    		if ('songlink' in $$props) $$invalidate(0, songlink = $$props.songlink);
    		if ('addToQueue' in $$props) $$invalidate(5, addToQueue = $$props.addToQueue);
    		if ('playSong' in $$props) $$invalidate(6, playSong = $$props.playSong);
    		if ('songCount' in $$props) songCount = $$props.songCount;
    		if ('songinput' in $$props) $$invalidate(1, songinput = $$props.songinput);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		songlink,
    		songinput,
    		addSong,
    		applyBorder,
    		removeBorder,
    		addToQueue,
    		playSong,
    		input_input_handler,
    		div1_binding
    	];
    }

    class AddSong extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { addToQueue: 5, playSong: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddSong",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get addToQueue() {
    		throw new Error_1("<AddSong>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addToQueue(value) {
    		throw new Error_1("<AddSong>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get playSong() {
    		throw new Error_1("<AddSong>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set playSong(value) {
    		throw new Error_1("<AddSong>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\QueueOptions.svelte generated by Svelte v3.59.2 */
    const file$2 = "src\\components\\QueueOptions.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "REMOVE";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "PLAY NOW";
    			attr_dev(button0, "class", "transparent-btn");
    			add_location(button0, file$2, 14, 4, 363);
    			attr_dev(button1, "class", "add svelte-1u1y7co");
    			add_location(button1, file$2, 15, 4, 438);
    			attr_dev(div, "class", "svelte-1u1y7co");
    			add_location(div, file$2, 13, 0, 352);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*removeSong*/ ctx[0])) /*removeSong*/ ctx[0].apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*playNow*/ ctx[1], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let selected;
    	let $selectedSongsFromQueue;
    	validate_store(selectedSongsFromQueue, 'selectedSongsFromQueue');
    	component_subscribe($$self, selectedSongsFromQueue, $$value => $$invalidate(3, $selectedSongsFromQueue = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('QueueOptions', slots, []);
    	let { playSelected } = $$props;
    	let { removeSong } = $$props;

    	const playNow = () => {
    		if (selected.length === 1) {
    			playSelected(selected[0]);
    			selectedSongsFromQueue.set([]);
    		}
    	};

    	$$self.$$.on_mount.push(function () {
    		if (playSelected === undefined && !('playSelected' in $$props || $$self.$$.bound[$$self.$$.props['playSelected']])) {
    			console.warn("<QueueOptions> was created without expected prop 'playSelected'");
    		}

    		if (removeSong === undefined && !('removeSong' in $$props || $$self.$$.bound[$$self.$$.props['removeSong']])) {
    			console.warn("<QueueOptions> was created without expected prop 'removeSong'");
    		}
    	});

    	const writable_props = ['playSelected', 'removeSong'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<QueueOptions> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('playSelected' in $$props) $$invalidate(2, playSelected = $$props.playSelected);
    		if ('removeSong' in $$props) $$invalidate(0, removeSong = $$props.removeSong);
    	};

    	$$self.$capture_state = () => ({
    		selectedSongsFromQueue,
    		playSelected,
    		removeSong,
    		playNow,
    		selected,
    		$selectedSongsFromQueue
    	});

    	$$self.$inject_state = $$props => {
    		if ('playSelected' in $$props) $$invalidate(2, playSelected = $$props.playSelected);
    		if ('removeSong' in $$props) $$invalidate(0, removeSong = $$props.removeSong);
    		if ('selected' in $$props) selected = $$props.selected;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$selectedSongsFromQueue*/ 8) {
    			selected = $selectedSongsFromQueue;
    		}
    	};

    	return [removeSong, playNow, playSelected, $selectedSongsFromQueue];
    }

    class QueueOptions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { playSelected: 2, removeSong: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QueueOptions",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get playSelected() {
    		throw new Error("<QueueOptions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set playSelected(value) {
    		throw new Error("<QueueOptions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeSong() {
    		throw new Error("<QueueOptions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set removeSong(value) {
    		throw new Error("<QueueOptions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Musicplayer.svelte generated by Svelte v3.59.2 */
    const file$1 = "src\\components\\Musicplayer.svelte";

    // (176:24) {:else}
    function create_else_block(ctx) {
    	let svg;
    	let rect0;
    	let rect1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			attr_dev(rect0, "x", "3.021");
    			attr_dev(rect0, "y", "2.26611");
    			attr_dev(rect0, "width", "3.77682");
    			attr_dev(rect0, "height", "14.3519");
    			attr_dev(rect0, "rx", "1.51073");
    			add_location(rect0, file$1, 177, 28, 8372);
    			attr_dev(rect1, "x", "12.0854");
    			attr_dev(rect1, "y", "2.26611");
    			attr_dev(rect1, "width", "3.77682");
    			attr_dev(rect1, "height", "14.3519");
    			attr_dev(rect1, "rx", "1.51073");
    			add_location(rect1, file$1, 178, 28, 8477);
    			attr_dev(svg, "class", "pause svelte-18sj26i");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "19");
    			attr_dev(svg, "height", "19");
    			attr_dev(svg, "viewBox", "0 0 19 19");
    			attr_dev(svg, "fill", "none");
    			add_location(svg, file$1, 176, 24, 8190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect0);
    			append_dev(svg, rect1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(svg, "click", /*pauseSong*/ ctx[14], false, false, false, false),
    					listen_dev(svg, "keydown", keydown_handler_2, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(176:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (172:20) {#if !play}
    function create_if_block_1(ctx) {
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M15.4701 7.77096C16.4524 8.35345 16.4524 9.77531 15.4701 10.3578L6.68325 15.568C5.68088 16.1623 4.4126 15.4399 4.4126 14.2746L4.4126 3.85421C4.4126 2.68887 5.68088 1.96643 6.68325 2.56078L15.4701 7.77096Z");
    			add_location(path, file$1, 173, 24, 7887);
    			attr_dev(svg, "class", "play svelte-18sj26i");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "19");
    			attr_dev(svg, "height", "19");
    			attr_dev(svg, "viewBox", "0 0 19 19");
    			attr_dev(svg, "fill", "none");
    			add_location(svg, file$1, 172, 20, 7707);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = [
    					listen_dev(svg, "click", /*continuePlay*/ ctx[13], false, false, false, false),
    					listen_dev(svg, "keydown", keydown_handler_1, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(172:20) {#if !play}",
    		ctx
    	});

    	return block;
    }

    // (205:0) {#if $selectedSongsFromQueue.length > 0}
    function create_if_block(ctx) {
    	let queueoptions;
    	let current;

    	queueoptions = new QueueOptions({
    			props: {
    				playSelected: /*playSelected*/ ctx[17],
    				removeSong: /*removeSong*/ ctx[19]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(queueoptions.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(queueoptions, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(queueoptions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(queueoptions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(queueoptions, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(205:0) {#if $selectedSongsFromQueue.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div9;
    	let div0;
    	let t0;
    	let section;
    	let svg0;
    	let path0;
    	let t1;
    	let header;
    	let t3;
    	let addsong;
    	let t4;
    	let div8;
    	let img;
    	let img_src_value;
    	let t5;
    	let h4;

    	let t6_value = (/*$currentSong*/ ctx[8].title
    	? /*$currentSong*/ ctx[8].title
    	: "") + "";

    	let t6;
    	let t7;
    	let div3;
    	let div1;
    	let input0;
    	let t8;
    	let div2;
    	let p0;
    	let t9_value = formatTime(/*count*/ ctx[2]) + "";
    	let t9;
    	let t10;
    	let p1;

    	let t11_value = formatTime(/*$currentSong*/ ctx[8].duration
    	? /*$currentSong*/ ctx[8].duration
    	: 0) + "";

    	let t11;
    	let t12;
    	let div7;
    	let div4;
    	let svg1;
    	let path1;
    	let rect0;
    	let t13;
    	let t14;
    	let svg2;
    	let path2;
    	let rect1;
    	let t15;
    	let svg3;
    	let path3;
    	let t16;
    	let div6;
    	let svg4;
    	let path4;
    	let t17;
    	let div5;
    	let input1;
    	let t18;
    	let queue_1;
    	let t19;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	addsong = new AddSong({
    			props: {
    				playSong: /*playSong*/ ctx[16],
    				addToQueue: /*addToQueue*/ ctx[18]
    			},
    			$$inline: true
    		});

    	function select_block_type(ctx, dirty) {
    		if (!/*play*/ ctx[6]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	queue_1 = new Queue({ $$inline: true });
    	let if_block1 = /*$selectedSongsFromQueue*/ ctx[7].length > 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div0 = element("div");
    			t0 = space();
    			section = element("section");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t1 = space();
    			header = element("header");
    			header.textContent = "Music Player";
    			t3 = space();
    			create_component(addsong.$$.fragment);
    			t4 = space();
    			div8 = element("div");
    			img = element("img");
    			t5 = space();
    			h4 = element("h4");
    			t6 = text(t6_value);
    			t7 = space();
    			div3 = element("div");
    			div1 = element("div");
    			input0 = element("input");
    			t8 = space();
    			div2 = element("div");
    			p0 = element("p");
    			t9 = text(t9_value);
    			t10 = space();
    			p1 = element("p");
    			t11 = text(t11_value);
    			t12 = space();
    			div7 = element("div");
    			div4 = element("div");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			rect0 = svg_element("rect");
    			t13 = space();
    			if_block0.c();
    			t14 = space();
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			rect1 = svg_element("rect");
    			t15 = space();
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t16 = space();
    			div6 = element("div");
    			svg4 = svg_element("svg");
    			path4 = svg_element("path");
    			t17 = space();
    			div5 = element("div");
    			input1 = element("input");
    			t18 = space();
    			create_component(queue_1.$$.fragment);
    			t19 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(div0, "class", "purple-bg svelte-18sj26i");
    			add_location(div0, file$1, 144, 4, 4509);
    			attr_dev(path0, "opacity", "0.18");
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "clip-rule", "evenodd");
    			attr_dev(path0, "d", "M260.351 16.3279C261.158 17.5744 261.676 18.986 261.866 20.4588C262.057 21.9317 261.915 23.4285 261.451 24.8393L214.765 167.079C212.637 173.552 208.358 179.102 202.638 182.806C196.918 186.509 190.103 188.143 183.326 187.436L155.784 184.564C148.031 183.756 140.916 179.9 136.005 173.845C131.095 167.791 128.791 160.033 129.6 152.28C130.408 144.526 134.264 137.412 140.319 132.501C146.373 127.591 154.131 125.286 161.884 126.095L197.804 129.846C200.065 130.081 202.339 129.534 204.246 128.296C206.154 127.058 207.579 125.204 208.285 123.043L226.306 68.1371L118.362 56.8518L86.5875 153.661C84.4638 160.14 80.1848 165.696 74.463 169.405C68.7411 173.113 61.9217 174.75 55.14 174.042L27.5938 171.142C23.6676 170.855 19.839 169.782 16.3355 167.986C12.832 166.191 9.72491 163.71 7.19881 160.691C4.6727 157.671 2.77908 154.175 1.63035 150.41C0.481622 146.644 0.101216 142.687 0.511742 138.771C0.922263 134.856 2.11533 131.063 4.02011 127.618C5.92488 124.173 8.50253 121.145 11.6 118.716C14.6974 116.286 18.2515 114.504 22.0513 113.474C25.851 112.444 29.8188 112.189 33.7192 112.723L69.5929 116.486C71.8514 116.724 74.1233 116.182 76.0309 114.949C77.9384 113.717 79.3667 111.869 80.0783 109.712L114.371 5.23049C115.079 3.07226 116.505 1.2215 118.411 -0.0139868C120.317 -1.24948 122.589 -1.79524 124.848 -1.56053L253.03 11.8455C254.507 11.9985 255.932 12.4805 257.199 13.2561C258.466 14.0318 259.543 15.0814 260.351 16.3279Z");
    			attr_dev(path0, "fill", "white");
    			add_location(path0, file$1, 147, 12, 4691);
    			attr_dev(svg0, "class", "bg-svg svelte-18sj26i");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "210");
    			attr_dev(svg0, "height", "188");
    			attr_dev(svg0, "viewBox", "0 0 210 188");
    			attr_dev(svg0, "fill", "none");
    			add_location(svg0, file$1, 146, 8, 4563);
    			attr_dev(header, "class", "svelte-18sj26i");
    			add_location(header, file$1, 149, 8, 6210);
    			attr_dev(img, "class", "music-cover svelte-18sj26i");
    			if (!src_url_equal(img.src, img_src_value = /*$currentSong*/ ctx[8].thumbnailUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 152, 12, 6335);
    			attr_dev(h4, "class", "svelte-18sj26i");
    			add_location(h4, file$1, 153, 12, 6413);
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "name", "");
    			attr_dev(input0, "id", "");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", "100");
    			attr_dev(input0, "class", "slider timeline-slider svelte-18sj26i");
    			add_location(input0, file$1, 156, 20, 6555);
    			attr_dev(div1, "class", "full-timeline svelte-18sj26i");
    			add_location(div1, file$1, 155, 16, 6506);
    			attr_dev(p0, "class", "current-time");
    			add_location(p0, file$1, 160, 20, 6797);
    			attr_dev(p1, "class", "full-time");
    			add_location(p1, file$1, 161, 20, 6866);
    			attr_dev(div2, "class", "time svelte-18sj26i");
    			add_location(div2, file$1, 159, 16, 6757);
    			add_location(div3, file$1, 154, 12, 6483);
    			attr_dev(path1, "d", "M2.65769 8.30309C1.67534 8.88559 1.67534 10.3074 2.65769 10.8899L11.4445 16.1001C12.4469 16.6945 13.7151 15.972 13.7151 14.8067L13.7151 4.38634C13.7151 3.22101 12.4469 2.49856 11.4445 3.09292L2.65769 8.30309Z");
    			add_location(path1, file$1, 167, 24, 7280);
    			attr_dev(rect0, "width", "2.38536");
    			attr_dev(rect0, "height", "14.209");
    			attr_dev(rect0, "rx", "1.19268");
    			attr_dev(rect0, "transform", "matrix(-1 0 0 1 2.38544 2.4921)");
    			add_location(rect0, file$1, 168, 24, 7526);
    			attr_dev(svg1, "class", "previous svelte-18sj26i");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "19");
    			attr_dev(svg1, "height", "19");
    			attr_dev(svg1, "viewBox", "0 0 19 19");
    			attr_dev(svg1, "fill", "none");
    			add_location(svg1, file$1, 166, 20, 7100);
    			attr_dev(path2, "d", "M15.4701 7.77096C16.4524 8.35345 16.4524 9.77531 15.4701 10.3578L6.68325 15.568C5.68088 16.1623 4.4126 15.4399 4.4126 14.2746L4.4126 3.85421C4.4126 2.68887 5.68088 1.96643 6.68325 2.56078L15.4701 7.77096Z");
    			add_location(path2, file$1, 183, 24, 8809);
    			attr_dev(rect1, "x", "15.7422");
    			attr_dev(rect1, "y", "1.96033");
    			attr_dev(rect1, "width", "2.38536");
    			attr_dev(rect1, "height", "14.209");
    			attr_dev(rect1, "rx", "1.19268");
    			add_location(rect1, file$1, 184, 24, 9051);
    			attr_dev(svg2, "class", "next svelte-18sj26i");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "width", "19");
    			attr_dev(svg2, "height", "19");
    			attr_dev(svg2, "viewBox", "0 0 19 19");
    			attr_dev(svg2, "fill", "none");
    			add_location(svg2, file$1, 182, 20, 8637);
    			attr_dev(path3, "d", "M10.6507 2.26611L12.6902 4.3056M12.6902 4.3056L10.6507 6.34508M12.6902 4.3056H7.7954C6.65318 4.3056 6.08207 4.3056 5.6458 4.52789C5.26205 4.72342 4.95005 5.03542 4.75452 5.41918C4.53223 5.85545 4.53223 6.42656 4.53223 7.56877V11.4438C4.53223 11.7595 4.53223 11.9174 4.54967 12.0499C4.67016 12.9651 5.39032 13.6853 6.30551 13.8057C6.43804 13.8232 6.5959 13.8232 6.91163 13.8232M9.97085 13.8232H14.8656C16.0078 13.8232 16.5789 13.8232 17.0152 13.6009C17.399 13.4054 17.711 13.0934 17.9065 12.7096C18.1288 12.2733 18.1288 11.7022 18.1288 10.56V6.685C18.1288 6.36927 18.1288 6.21141 18.1113 6.07888C17.9909 5.16369 17.2707 4.44353 16.3555 4.32305C16.223 4.3056 16.0651 4.3056 15.7494 4.3056M9.97085 13.8232L12.0103 15.8627M9.97085 13.8232L12.0103 11.7837");
    			attr_dev(path3, "stroke-width", "1.51073");
    			attr_dev(path3, "stroke-linecap", "round");
    			attr_dev(path3, "stroke-linejoin", "round");
    			add_location(path3, file$1, 188, 24, 9389);
    			attr_dev(svg3, "class", "repeat svelte-18sj26i");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "width", "19");
    			attr_dev(svg3, "height", "19");
    			attr_dev(svg3, "viewBox", "0 0 19 19");
    			attr_dev(svg3, "fill", "none");
    			toggle_class(svg3, "repeat-active", /*repeat*/ ctx[5]);
    			add_location(svg3, file$1, 187, 20, 9179);
    			attr_dev(div4, "class", "controls svelte-18sj26i");
    			add_location(div4, file$1, 165, 16, 7056);
    			attr_dev(path4, "d", "M11.1067 2.59999C11.2509 2.7707 11.3302 2.98674 11.3302 3.21033V14.92C11.3303 15.1001 11.2788 15.2765 11.1818 15.4283C11.0849 15.5801 10.9466 15.7011 10.7831 15.7768C10.6197 15.8526 10.438 15.88 10.2595 15.8559C10.081 15.8317 9.91314 15.757 9.7757 15.6406L6.0238 12.4635H3.21007C2.75931 12.4635 2.32702 12.2845 2.00829 11.9658C1.68956 11.647 1.5105 11.2147 1.5105 10.764V7.36483C1.5105 6.91408 1.68956 6.48179 2.00829 6.16306C2.32702 5.84432 2.75931 5.66526 3.21007 5.66526H6.0238L9.77646 2.48971C9.96761 2.32813 10.2151 2.24906 10.4645 2.26988C10.714 2.2907 10.9449 2.40971 11.1067 2.60075V2.59999ZM12.9195 6.52638C13.0478 6.44836 13.2017 6.42442 13.3476 6.45983C13.4935 6.49523 13.6194 6.58709 13.6976 6.71522C14.1311 7.42526 14.3487 8.21991 14.3487 9.08706C14.3487 9.95498 14.1311 10.7496 13.6976 11.4597C13.6599 11.5253 13.6095 11.5827 13.5492 11.6286C13.489 11.6744 13.4202 11.7077 13.3469 11.7265C13.2736 11.7453 13.1972 11.7492 13.1224 11.738C13.0475 11.7269 12.9757 11.7008 12.9111 11.6614C12.8465 11.6219 12.7904 11.57 12.7462 11.5085C12.702 11.4471 12.6706 11.3774 12.6538 11.3036C12.637 11.2298 12.6351 11.1534 12.6483 11.0789C12.6615 11.0044 12.6895 10.9332 12.7307 10.8697C13.054 10.3395 13.2156 9.74952 13.2156 9.08706C13.2156 8.42536 13.054 7.83543 12.7307 7.30516C12.6527 7.17692 12.6287 7.02295 12.6641 6.87708C12.6995 6.7312 12.7914 6.60458 12.9195 6.52638Z");
    			attr_dev(path4, "fill", "white");
    			add_location(path4, file$1, 193, 24, 10454);
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg4, "width", "19");
    			attr_dev(svg4, "height", "19");
    			attr_dev(svg4, "viewBox", "0 0 19 19");
    			attr_dev(svg4, "fill", "none");
    			add_location(svg4, file$1, 192, 20, 10333);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "name", "");
    			attr_dev(input1, "id", "");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "100");
    			attr_dev(input1, "class", "slider svelte-18sj26i");
    			add_location(input1, file$1, 196, 24, 11968);
    			attr_dev(div5, "class", "full-volume flex-between svelte-18sj26i");
    			add_location(div5, file$1, 195, 20, 11904);
    			attr_dev(div6, "class", "volume svelte-18sj26i");
    			add_location(div6, file$1, 191, 16, 10291);
    			attr_dev(div7, "class", "flex-between");
    			add_location(div7, file$1, 164, 12, 7012);
    			attr_dev(div8, "class", "music-controls svelte-18sj26i");
    			add_location(div8, file$1, 151, 8, 6293);
    			attr_dev(section, "class", "svelte-18sj26i");
    			add_location(section, file$1, 145, 4, 4544);
    			attr_dev(div9, "class", "container svelte-18sj26i");
    			add_location(div9, file$1, 143, 0, 4480);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div0);
    			append_dev(div9, t0);
    			append_dev(div9, section);
    			append_dev(section, svg0);
    			append_dev(svg0, path0);
    			append_dev(section, t1);
    			append_dev(section, header);
    			append_dev(section, t3);
    			mount_component(addsong, section, null);
    			append_dev(section, t4);
    			append_dev(section, div8);
    			append_dev(div8, img);
    			append_dev(div8, t5);
    			append_dev(div8, h4);
    			append_dev(h4, t6);
    			append_dev(div8, t7);
    			append_dev(div8, div3);
    			append_dev(div3, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*timeline*/ ctx[0]);
    			/*input0_binding*/ ctx[22](input0);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, p0);
    			append_dev(p0, t9);
    			append_dev(div2, t10);
    			append_dev(div2, p1);
    			append_dev(p1, t11);
    			append_dev(div8, t12);
    			append_dev(div8, div7);
    			append_dev(div7, div4);
    			append_dev(div4, svg1);
    			append_dev(svg1, path1);
    			append_dev(svg1, rect0);
    			append_dev(div4, t13);
    			if_block0.m(div4, null);
    			append_dev(div4, t14);
    			append_dev(div4, svg2);
    			append_dev(svg2, path2);
    			append_dev(svg2, rect1);
    			append_dev(div4, t15);
    			append_dev(div4, svg3);
    			append_dev(svg3, path3);
    			append_dev(div7, t16);
    			append_dev(div7, div6);
    			append_dev(div6, svg4);
    			append_dev(svg4, path4);
    			append_dev(div6, t17);
    			append_dev(div6, div5);
    			append_dev(div5, input1);
    			set_input_value(input1, /*audio*/ ctx[1]);
    			/*input1_binding*/ ctx[24](input1);
    			append_dev(section, t18);
    			mount_component(queue_1, section, null);
    			insert_dev(target, t19, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[21]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[21]),
    					listen_dev(input0, "input", /*progressScript*/ ctx[9], false, false, false, false),
    					listen_dev(svg1, "click", /*previous*/ ctx[12], false, false, false, false),
    					listen_dev(svg1, "keydown", keydown_handler, false, false, false, false),
    					listen_dev(svg2, "click", /*next*/ ctx[11], false, false, false, false),
    					listen_dev(svg2, "keydown", keydown_handler_3, false, false, false, false),
    					listen_dev(svg3, "click", /*putOnRepeat*/ ctx[15], false, false, false, false),
    					listen_dev(svg3, "keydown", keydown_handler_4, false, false, false, false),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[23]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[23]),
    					listen_dev(input1, "input", /*audioChange*/ ctx[10], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*$currentSong*/ 256 && !src_url_equal(img.src, img_src_value = /*$currentSong*/ ctx[8].thumbnailUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty[0] & /*$currentSong*/ 256) && t6_value !== (t6_value = (/*$currentSong*/ ctx[8].title
    			? /*$currentSong*/ ctx[8].title
    			: "") + "")) set_data_dev(t6, t6_value);

    			if (dirty[0] & /*timeline*/ 1) {
    				set_input_value(input0, /*timeline*/ ctx[0]);
    			}

    			if ((!current || dirty[0] & /*count*/ 4) && t9_value !== (t9_value = formatTime(/*count*/ ctx[2]) + "")) set_data_dev(t9, t9_value);

    			if ((!current || dirty[0] & /*$currentSong*/ 256) && t11_value !== (t11_value = formatTime(/*$currentSong*/ ctx[8].duration
    			? /*$currentSong*/ ctx[8].duration
    			: 0) + "")) set_data_dev(t11, t11_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div4, t14);
    				}
    			}

    			if (!current || dirty[0] & /*repeat*/ 32) {
    				toggle_class(svg3, "repeat-active", /*repeat*/ ctx[5]);
    			}

    			if (dirty[0] & /*audio*/ 2) {
    				set_input_value(input1, /*audio*/ ctx[1]);
    			}

    			if (/*$selectedSongsFromQueue*/ ctx[7].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*$selectedSongsFromQueue*/ 128) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(addsong.$$.fragment, local);
    			transition_in(queue_1.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(addsong.$$.fragment, local);
    			transition_out(queue_1.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			destroy_component(addsong);
    			/*input0_binding*/ ctx[22](null);
    			if_block0.d();
    			/*input1_binding*/ ctx[24](null);
    			destroy_component(queue_1);
    			if (detaching) detach_dev(t19);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const keydown_handler = () => {
    	
    };

    const keydown_handler_1 = () => {
    	
    };

    const keydown_handler_2 = () => {
    	
    };

    const keydown_handler_3 = () => {
    	
    };

    const keydown_handler_4 = () => {
    	
    };

    function instance$1($$self, $$props, $$invalidate) {
    	let queue;
    	let $selectedSongsFromQueue;
    	let $currentSong;
    	let $playActive;
    	let $songs;
    	validate_store(selectedSongsFromQueue, 'selectedSongsFromQueue');
    	component_subscribe($$self, selectedSongsFromQueue, $$value => $$invalidate(7, $selectedSongsFromQueue = $$value));
    	validate_store(currentSong, 'currentSong');
    	component_subscribe($$self, currentSong, $$value => $$invalidate(8, $currentSong = $$value));
    	validate_store(playActive, 'playActive');
    	component_subscribe($$self, playActive, $$value => $$invalidate(28, $playActive = $$value));
    	validate_store(songs, 'songs');
    	component_subscribe($$self, songs, $$value => $$invalidate(20, $songs = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Musicplayer', slots, []);
    	let timeline = 0;
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
    		if ($playActive === true) {
    			$$invalidate(2, count = Math.round(timeline / 100 * $currentSong.duration));
    			$$invalidate(0, timeline = count / $currentSong.duration * 100);
    		}

    		$$invalidate(4, timelineSlider.style.background = `linear-gradient(to right, #1BD760 ${timeline}%, rgba(255, 255, 255, 0.10) ${timeline}%)`, timelineSlider);
    		$$invalidate(4, timelineSlider.style.transition = 'all .3s ease', timelineSlider);
    	};

    	const audioChange = () => {
    		$$invalidate(3, audioLevel.style.background = `linear-gradient(to right, #1BD760 ${audio}%, rgba(255, 255, 255, 0.10) ${audio}%)`, audioLevel);
    	};

    	const next = () => {
    		$$invalidate(2, count = 0);
    		$$invalidate(0, timeline = 0);
    		progressScript();
    		clearInterval(timeInterval);
    		playActive.set(false);
    		playSong();
    	};

    	const previous = () => {
    		$$invalidate(2, count = 0);
    		$$invalidate(0, timeline = 0);
    		clearInterval(timeInterval);
    		playActive.set(false);
    		let item = previousSongs.shift();

    		if (current !== item) {
    			queue.unshift(current);
    			addQueueId();
    		}

    		queue.unshift(item);
    		addQueueId();
    		playSong();

    		if (previousSongs.length > 1) {
    			previousSongs.shift();
    		}
    	};

    	function onSongEnd() {
    		clearInterval(timeInterval);
    		playActive.set(false);
    		$$invalidate(2, count = 0);
    		$$invalidate(0, timeline = 0);
    		currentSong.set({});

    		// current = {}
    		if (repeat) {
    			playSong();
    		} else {
    			next();
    		}
    	}

    	const continuePlay = () => {
    		playSong();
    		$$invalidate(6, play = true);
    	};

    	const pauseSong = () => {
    		$$invalidate(6, play = false);
    		clearInterval(timeInterval);
    		playActive.set(false);
    	};

    	const putOnRepeat = () => {
    		$$invalidate(5, repeat = !repeat);
    	};

    	const playSong = () => {
    		if (queue.length > 0 || !play) {
    			if (!$playActive) {
    				if (!play) {
    					current = current;
    				} else if (repeat) {
    					current = current;
    				} else if (play && !repeat) {
    					current = queue.shift();
    				} else {
    					current = current;
    				}

    				previousSongs.unshift(current);
    				songs.set(queue);
    				playActive.set(true);

    				currentSong.set({
    					title: current.title,
    					thumbnailUrl: current.thumbnailUrl,
    					duration: current.duration,
    					id: current.id,
    					url: current.url
    				});

    				timeInterval = setInterval(
    					function () {
    						$$invalidate(2, count++, count);
    						$$invalidate(0, timeline = count / $currentSong.duration * 100);
    						progressScript();

    						if (count >= $currentSong.duration) {
    							onSongEnd();
    						}
    					},
    					1000
    				);
    			}
    		}
    	};

    	const playSelected = item => {
    		$$invalidate(2, count = 0);
    		$$invalidate(0, timeline = 0);
    		clearInterval(timeInterval);
    		let selectedItem = queue.filter(s => s.id === item);
    		queue = queue.filter(s => s.id !== item);
    		queue.unshift(selectedItem[0]);
    		addQueueId();
    		playActive.set(false);
    		playSong();
    	};

    	const addQueueId = () => {
    		let itemsWithQueueId = queue.map((item, index) => {
    			return { queueId: index + 1, ...item };
    		});

    		songs.set(itemsWithQueueId);
    	};

    	function addToQueue(songUrl, duration, title, thumbnailUrl, id) {
    		queue.push({
    			url: songUrl,
    			duration,
    			title,
    			thumbnailUrl,
    			id
    		});

    		addQueueId();
    		totalSongs.set(queue.length);
    	}

    	const removeSong = () => {
    		$selectedSongsFromQueue.map(s => {
    			queue = queue.filter(i => i.id !== s);
    		});

    		songs.set(queue);
    		addQueueId();
    		selectedSongsFromQueue.set([]);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Musicplayer> was created with unknown prop '${key}'`);
    	});

    	function input0_change_input_handler() {
    		timeline = to_number(this.value);
    		$$invalidate(0, timeline);
    	}

    	function input0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			timelineSlider = $$value;
    			$$invalidate(4, timelineSlider);
    		});
    	}

    	function input1_change_input_handler() {
    		audio = to_number(this.value);
    		$$invalidate(1, audio);
    	}

    	function input1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			audioLevel = $$value;
    			$$invalidate(3, audioLevel);
    		});
    	}

    	$$self.$capture_state = () => ({
    		Queue,
    		AddSong,
    		formatTime,
    		currentSong,
    		songs,
    		totalSongs,
    		playActive,
    		selectedSongsFromQueue,
    		QueueOptions,
    		timeline,
    		audio,
    		count,
    		audioLevel,
    		timelineSlider,
    		timeInterval,
    		repeat,
    		play,
    		previousSongs,
    		current,
    		progressScript,
    		audioChange,
    		next,
    		previous,
    		onSongEnd,
    		continuePlay,
    		pauseSong,
    		putOnRepeat,
    		playSong,
    		playSelected,
    		addQueueId,
    		addToQueue,
    		removeSong,
    		queue,
    		$selectedSongsFromQueue,
    		$currentSong,
    		$playActive,
    		$songs
    	});

    	$$self.$inject_state = $$props => {
    		if ('timeline' in $$props) $$invalidate(0, timeline = $$props.timeline);
    		if ('audio' in $$props) $$invalidate(1, audio = $$props.audio);
    		if ('count' in $$props) $$invalidate(2, count = $$props.count);
    		if ('audioLevel' in $$props) $$invalidate(3, audioLevel = $$props.audioLevel);
    		if ('timelineSlider' in $$props) $$invalidate(4, timelineSlider = $$props.timelineSlider);
    		if ('timeInterval' in $$props) timeInterval = $$props.timeInterval;
    		if ('repeat' in $$props) $$invalidate(5, repeat = $$props.repeat);
    		if ('play' in $$props) $$invalidate(6, play = $$props.play);
    		if ('previousSongs' in $$props) previousSongs = $$props.previousSongs;
    		if ('current' in $$props) current = $$props.current;
    		if ('queue' in $$props) queue = $$props.queue;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$songs*/ 1048576) {
    			queue = $songs;
    		}
    	};

    	return [
    		timeline,
    		audio,
    		count,
    		audioLevel,
    		timelineSlider,
    		repeat,
    		play,
    		$selectedSongsFromQueue,
    		$currentSong,
    		progressScript,
    		audioChange,
    		next,
    		previous,
    		continuePlay,
    		pauseSong,
    		putOnRepeat,
    		playSong,
    		playSelected,
    		addToQueue,
    		removeSong,
    		$songs,
    		input0_change_input_handler,
    		input0_binding,
    		input1_change_input_handler,
    		input1_binding
    	];
    }

    class Musicplayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Musicplayer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let musicplayer;
    	let current;
    	musicplayer = new Musicplayer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(musicplayer.$$.fragment);
    			attr_dev(main, "class", "app svelte-9fqq");
    			add_location(main, file, 4, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(musicplayer, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(musicplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(musicplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(musicplayer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Musicplayer });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.getElementById('app'),
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
