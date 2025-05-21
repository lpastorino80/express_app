import React, {useState} from "react";
import "./styles.css";

function ConfigWindow() {
    const [selectedOption, setSelectedOption] = useState('');

    const handleChange = (e) => {
        setSelectedOption(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedOption && selectedOption !== '') {
            console.log('Valor seleccionado:', selectedOption);
            try {
                window.electronAPI.setConfigUrl(selectedOption);
            } catch (error) {
                console.error('Error al obtener el path del logo:', error);
            }
        }
    };

    return (
        <div className="card">
            <h2>Config. de ambiente</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="combo">Seleccione una opción:</label>
                <select id="combo" value={selectedOption} onChange={handleChange}>
                    <option value="">-- Elija una opción --</option>
                    <option value="https://posexpress.geocom.com.uy">Producción Uruguay</option>
                    <option value="https://argentina.geocom.com.uy">Producción Argentina</option>
                    <option value="https://xprandroid.geocom.com.uy">Mobile Uruguay</option>
                    <option value="https://qaexpress.geocom.com.uy">QA Uruguay</option>
                    <option value="https://xprargentina.geocom.com.uy">QA Argentina</option>
                </select>

                <button type="submit">Guardar</button>
            </form>
        </div>
    );
}

export default ConfigWindow;