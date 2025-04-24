import React from 'react';

import "./styles.css";
import numeral from 'numeral';
import '../assets/bootstrap.min.css';
import VideoPlayerLocal from './VideoComponent';

function formatNumber(value, currency) {
    if (!value) {
        value = '0.00';
    }
    if (!currency) {
        currency = {
            isoName: 'UYU',
            symbol: '$'
        }
    }
    return `${currency.symbol}${numeral(value).format('0,0.00')}`;
}

const VideoPlayer = ({ smallVideo }) => (
    <div className='iframe-container'>
        <iframe
        src={smallVideo}
        title="YouTube video player"
        className="responsive-iframe"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      ></iframe>
    </div>
);

/*const VideoPlayerLocal = ({ smallVideo }) => (
    <div className='iframe-container'>
        <video className="responsive-iframe" controls autoPlay loop muted>
        <source src={smallVideo} type="video/mp4" />
        Tu navegador no soporta la etiqueta de video.
      </video>
    </div>
);*/

const TicketHeader = ({ ticket, chainImage, cashierName, clientName }) => (
    <div className="ticket-header">
        {cashierName && chainImage && <div className="status-item-image">
            <div className="chain-logo">
                <img src={chainImage} alt="imagen cadena"/>
            </div>    
        </div>}
        {cashierName && <div className={`${chainImage ? 'status-item' : 'status-item-without-image'}`}>CAJERO: <span className="highlight">{cashierName}</span></div>}
        {clientName && <div className={`${chainImage ? 'status-item' : 'status-item-without-image'}`}>CLIENTE: <span className="highlight">{clientName}</span></div>}
    </div>
);

const TicketItem = ({item, defaultCurrency}) => (
    <div className="item">
        <div className="item-details">
            <div className="item-detail item-detail-quantity">
                <span>x {item.quantity}</span>
            </div>
            <div className="item-detail item-detail-description-row">
                {item.description}
            </div>
            {item.totals.discountCurrency != 0 && <div className="item-detail item-detail-discount">
                <span> (-{formatNumber(item.totals.discountCurrency, defaultCurrency)}) </span>
            </div>}
            <div className="item-detail item-detail-total-row">
                <span>{formatNumber(item.totals.priceCurrency, defaultCurrency)}</span>
            </div>
        </div>
    </div>
);

const TicketFooter = ({ticket, defaultCurrency, ticketHasItems}) => (
    <div className="ticket-footer">
        {ticket && ticketHasItems && <div className="info-container">
            <div className="info-block">
                <div className="label">SubTotal</div>
                <div className="value">{formatNumber(ticket.total + ticket.totalDiscountCurrency, defaultCurrency)}</div>
            </div>
            <div className="info-block">
                <div className="label">Descuentos Totales</div>
                <div className="value">{formatNumber(ticket.totalDiscountCurrency, defaultCurrency)}</div>
            </div>
            <div className="info-block">
                <div className="label">Total</div>
                <div className="value">{formatNumber(ticket.totalCurrency, defaultCurrency)}</div>
            </div>
        </div>}
    </div>
);

const EmptyCart = ({ ticket, chainImage, smallVideo, defaultCurrency, itemImage }) => (
    <div className={`main-panel`}>
        <TicketHeader ticket= {ticket} chainImage={chainImage} cashierName={ticket.cashierName} clientName={ticket.client?.fullName} />
        <div className="container empty-cart">
            {smallVideo && <div className="company-video empty-cart">
                <VideoPlayerLocal path={smallVideo}/>
            </div>}
        </div>
        {smallVideo == null && <div>
            <div className="container empty-cart">
            </div>
            <div className="black-panel"></div>
        </div>}
    </div>
)

const Cart = ({ ticket, chainImage, smallVideo, defaultCurrency, itemImage, ticketHasItems }) => (
    <div className={`main-panel ${smallVideo ? 'small-video' : ''}`}>
        <TicketHeader ticket= {ticket} chainImage={chainImage} cashierName={ticket.cashierName} clientName={ticket.client?.fullName} />
        <div className="container text-center">
            <div className='row'>
                {smallVideo && 
                <div className={`${ticketHasItems ? 'col-md-5 col-sm-12' : 'col-md-12 col-sm-12 company-video-container'}`}>
                    <div className={`${ticketHasItems ? 'company-video' : 'company-video empty-cart'}`}>
                        <VideoPlayerLocal path={smallVideo}/>
                    </div>
                </div>}
            </div>
            {ticketHasItems && <div className='row'>
                <div className={`col-md-5 col-sm-12 ${smallVideo ? 'item-image-container' : 'item-image-container-without-video'}`}>
                    {ticket && ticket.cashierName && itemImage && ticketHasItems && 
                    <div className="item-image">
                        <img src={itemImage} alt="imagen item"/>
                    </div>}
                </div>
                <div className="col-md-7 col-sm-12 text-left">
                    <div className={`${smallVideo ? 'item-details-body' : 'item-details-body-without-video'}`}>
                        {ticket.items?.slice().reverse().map((item, index) => (
                            <TicketItem key={index} item={item} defaultCurrency={defaultCurrency}/>
                        ))}
                    </div>
                </div>
            </div>}
        </div>
        <TicketFooter ticket={ticket} defaultCurrency={defaultCurrency} ticketHasItems={ticketHasItems}/>
    </div>
);

const SecondWindow = ({ ticket, chainImage, smallVideo, defaultCurrency, itemImage, ticketHasItems }) => (
    <div className={`main-panel ${smallVideo ? 'small-video' : ''}`}>
    {(() => {
        //if (ticket && ticket.items && ticket.items.length > 0) {
            return <Cart ticket={ticket} chainImage={chainImage} smallVideo={smallVideo} defaultCurrency={defaultCurrency} itemImage={itemImage} ticketHasItems={ticketHasItems} />
        /*} else {
            return <EmptyCart ticket={ticket} chainImage={chainImage} smallVideo={smallVideo} defaultCurrency={ticket.currency} itemImage={itemImage} />
        }*/
    })()}
    </div>
);

export default SecondWindow;
