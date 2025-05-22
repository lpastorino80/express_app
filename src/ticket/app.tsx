import React, {useEffect, useState} from 'react';
import SecondWindow from "./SecondWindow";

const App = () => {
  
    const [ticket, setTicket] = useState({
        currency: undefined,
        items: []
    });
    
    const [imageURL, setImageURL] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [chainImageURL, setChainImageURL] = useState(null);
    const [chainImageSrc, setChainImageSrc] = useState(null);
    const [serverURL, setServerURL] = useState(null);
    //const videoURL = 'https://www.youtube.com/embed/vQbYvjmfbr4?autoplay=1&mute=1&controls=0&loop=1&playlist=vQbYvjmfbr4';
    //const videoURL = window.electronAPI.getVideoPath();
    const [videoPath, setVideoPath] = useState(null);
    const [logoPath, setLogoPath] = useState(null);

    useEffect(() => {
        const getLogoPath = async () => {
            try {
                const value = await window.electronAPI.getFiservLogoPath();
                setLogoPath(value);
                console.log("Logo path: " + value);
            } catch (error) {
                console.error('Error al obtener el path del logo:', error);
            }
        };
        getLogoPath();
      const getVideoPath = async () => {
        try {
            const value = await window.electronAPI.checkVideo();
            setVideoPath(value);
            console.log("Video path: " + value);
        } catch (error) {
            console.error('Error al obtener el path del video:', error);
        }
      };
      getVideoPath();
      const getServerUrl = async () => {
        try {
            const value = await window.electronAPI.getServerUrl();
            setServerURL(value);
        } catch (error) {
            console.error('Error al obtener la URL del servidor:', error);
        }
      };
      getServerUrl();
      addEventListener("message", ev => {
          if (ev && ev.data && ev.data.backend && ev.data.event === 'ticket_changed') {
            const ticket = ev.data.data;
            setTicket(ticket);
            if (ticket) {
              if (ticket.chainData) {
                setChainImageURL(ticket.chainData.image);
              }
              if (ticket && ticket.items && ticket.items.length > 0) {
                const image = ticket.items[ticket.items.length-1].image;
                setImageURL(image);
              }
            } else {
              setImageURL(null);
              setImageSrc(null);
              setChainImageSrc(null);
              setChainImageURL(null);
            }
          }
      });
    }, []);

    // get chain image
    useEffect(() => {
      const fetchChainImage = async (currentToken) => {
        if (chainImageURL == null) {
          setChainImageSrc(null);
          return;
        }
        if (currentToken == null || chainImageSrc != null) {
          return;
        }

        try {
          const response = await fetch(serverURL + chainImageURL, {
            method: "GET",
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              Authorization: `Bearer ${currentToken}`,
            },
          });

          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = () => setChainImageSrc(reader.result);
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error("Error fetching chain image:", error);
        }
      };
      window.electronAPI.getLocalStorage('auth-express').then((result) => {
        if (result != null && result != undefined && result != "") {
          const auth = JSON.parse(result);
          const currentToken = auth.token.token;
          fetchChainImage(currentToken);
        }
      });
    }, [chainImageURL]);


    // get item image
    useEffect(() => {
      const fetchTicketImage = async (currentToken) => {
        if (currentToken == null || imageURL == null || imageURL === "") {
          setImageURL(null);
          setImageSrc(null);
          return;
        }

        try {
          const response = await fetch(serverURL + imageURL, {
            method: "GET",
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              Authorization: `Bearer ${currentToken}`,
            },
          });

          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = () => setImageSrc(reader.result);
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error("Error fetching ticket image:", error);
        }
      };
      window.electronAPI.getLocalStorage('auth-express').then((result) => {
        if (result != null && result != "") {
          const auth = JSON.parse(result);
          const currentToken = auth.token.token;
          fetchTicketImage(currentToken);
        }
      });
    }, [imageURL]);

    return <SecondWindow ticket={ticket} chainImage={chainImageSrc} smallVideo={videoPath} logoPath={logoPath} defaultCurrency={ticket.currency} itemImage={imageSrc} ticketHasItems={ticket.items && ticket.items.length > 0} />;
}

export default App;
