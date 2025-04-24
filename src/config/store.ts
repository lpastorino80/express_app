import Store from 'electron-store';

const store = new Store();

function setValue(key: string, value: string) {
    store.set(key, value);
}

function getValue(key: string): unknown {
    return store.get(key);
}

function deleteValue(key: string) {
    return store.delete(key);
}

export {getValue, setValue, deleteValue}