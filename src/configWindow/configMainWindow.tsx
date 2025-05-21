import React from 'react';
import {createRoot} from 'react-dom/client'
import ConfigApp from "./configApp";

createRoot(document.getElementById('root'))
.render(
    <React.StrictMode>
        <ConfigApp />
    </React.StrictMode>
)