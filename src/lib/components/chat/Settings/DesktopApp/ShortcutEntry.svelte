<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let value = '';
  export let placeholder = 'Press a key combination';
  
  const dispatch = createEventDispatcher<{
    change: string;
    clear: void;
  }>();

  let currentKeys: Set<string> = new Set();
  let isEditing = false;

  function handleKeyDown(e: KeyboardEvent) {
    e.preventDefault();
    
    // Only allow if it starts with a modifier
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      return;
    }

    // Don't process if the key pressed is just a modifier key
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      return;
    }

    currentKeys.clear();
    
    // Add modifiers in a consistent order:
    // Super/Cmd first, then Control, Alt, Shift
    if (e.metaKey) currentKeys.add(navigator.platform.includes('Mac') ? 'Cmd' : 'Super');
    if (e.ctrlKey) currentKeys.add('Ctrl');
    if (e.altKey) currentKeys.add(navigator.platform.includes('Mac') ? 'Opt' : 'Alt');
    if (e.shiftKey) currentKeys.add('Shift');

    // Convert key to proper format
    let key = e.code;
    if (key.startsWith('Key')) {
      key = key.slice(3);
    } else if (key.startsWith('Digit')) {
      key = key.slice(5);
    }
    
    currentKeys.add(key);
    
    // Update display value
    value = Array.from(currentKeys).join('+');
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      value = '';
      currentKeys.clear();
      dispatch('clear');
      e.target?.blur();
    } else if (e.key === 'Enter' && value) {
      dispatch('change', value);
      e.target?.blur();
    }
  }

  function handleBlur() {
    isEditing = false;
    if (value) {
      dispatch('change', value);
    }
  }

  function handleFocus() {
    isEditing = true;
  }
</script>

<div class="relative">
  <input
    type="text"
    {placeholder}
    {value}
    readonly
    class="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
    on:keydown={handleKeyDown}
    on:keyup={handleKeyUp}
    on:blur={handleBlur}
    on:focus={handleFocus}
  />
  
  {#if value && isEditing}
    <button
      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      on:click={() => {
        value = '';
        currentKeys.clear();
        dispatch('clear');
      }}
    >
      ✕
    </button>
  {/if}
</div>
