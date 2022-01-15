/**
 * 
 */
let WEB3_GATEWAY, WEB3_COLLECTIBLES_ADDRESS, WEB3_MARKETPLACE_ADDRESS, WEB3_MARKETPLACE_PROXY_ADDRESS, IPFS_GATEWAY, CACHE_ENABLED;

/**
 * Custon events used for site functionality
 */
const ContractsCreated = new CustomEvent('contractsCreated', {bubbles: true});
const EmogramsUpdated = new CustomEvent('emogramsUpdated', {bubbles: true});
const EmogramsLoaded = new CustomEvent('emogramsLoaded', {bubbles: true});
const EmogramAddedToArray = new CustomEvent('emogramAddedToArray', {bubbles: true});
const FunctionalityUnlocked = new CustomEvent('functionalityUnlocked', {bubbles: true});
const Web3Connected = new CustomEvent('web3Connected', {bubbles: true});

/**
 * Wrapper for web3 functionality
 */
let Web3Wrapper = {
    ChainId: null,
    Provider: null,   
    get GetWeb3Host() {
        return WEB3_GATEWAY; 
    },
    get GetCollectiblesAddress() {
        return WEB3_COLLECTIBLES_ADDRESS; 
    },
    get GetMarketplaceAddress() {
        return WEB3_MARKETPLACE_ADDRESS; 
    },
    get GetMarketplaceProxyAddress() {
        return WEB3_MARKETPLACE_PROXY_ADDRESS; 
    },

    /**
     * Get current address selected in metamask
     * 
     * @param {function} _callBack      
     */
    getSelectedAddress: (_callBack) => {   
        if(typeof Web3Wrapper.SelectedAddress === 'undefined') {            
            if(typeof window.ethereum !== 'undefined') {
                window.ethereum.request({ method: 'eth_accounts' })
                    .then( (result) => { 

                        if(result.length > 0) { 
                            Web3Wrapper.SelectedAddress = result[0];  
                            if(typeof _callBack !== 'undefined') { _callBack(Web3Wrapper.SelectedAddress); }
                        } else {
                            if(typeof _callBack !== 'undefined') { _callBack(undefined); }
                        }                           
                        
                    })
                    .catch( (_) => {                         
                        if(typeof _callBack !== 'undefined') { _callBack(undefined); }
                    });
            } else {
                _callBack(undefined);
            }
        } else {
            if(typeof _callBack !== 'undefined') { 
                _callBack(Web3Wrapper.SelectedAddress);                     
            } else {
                return Web3Wrapper.SelectedAddress;
            }
        }            
            
        
        
    },    

    /**
     * Checks if ethereum provider is installed using
     * https://www.npmjs.com/package/@metamask/detect-provider
     */    
    getIsMetamaskInstalled: (_callBack) => {
        detectEthereumProvider()
            .then( (result) => { 
                if(typeof _callBack !== 'undefined') { _callBack(result !== null); }
            }) 
            .catch( _ => { 
                if(typeof _callBack !== 'undefined') { _callBack(false); } 
            });
    },


    /**
     * Getter and setter for IsFunctionalityLimited.
     * 
     * Functionality is limited if:
     * - the user doesn't have metamask
     * - the user didn't approve the contract yet
     * 
     * Limited users cannot bid,buy,sell, etc.
     */
    _isFunctionalityLimited: true,
    get IsFunctionalityLimited() {
        if(CACHE_ENABLED) return typeof sessionStorage.IsFunctionalityLimited !== 'undefined' ? sessionStorage.IsFunctionalityLimited : undefined;
        else return this._isFunctionalityLimited !== null ? this._isFunctionalityLimited : undefined;
    },
    set IsFunctionalityLimited(value) {
        if(CACHE_ENABLED) { if(typeof value !== 'undefined') { sessionStorage.IsFunctionalityLimited = value; } }
        else { this._isFunctionalityLimited = value; }

        if(value) { $(document).trigger('functionalityUnlocked'); }        
    },

    IsAutologinEnabled: false,

    /**
     * Check if the contract should be used through metamask of through a gateway.
     * Metamask should be preffered
     *
     * @returns {string}
     */
    getProviderToUse: async () => {
        return Web3Wrapper.IsMetamaskInstalled == true ? "metamask" : "host";
    },

    /**
     * Get current ethereum provider using 
     * https://www.npmjs.com/package/@metamask/detect-provider
     */
    detectProvider: async () => {
        $('.connect-btn').prop('disabled', true);

        const provider = await detectEthereumProvider();

        if (provider) {
            $('.connect-btn').prop('disabled', false);
            Web3Wrapper.ProviderDetected = true;

            Web3Wrapper.ChainId = await ethereum.request({ method: 'eth_chainId' });
        } else {            
            

            $('.modal').find('hide_modal').click(() => {
                Web3Wrapper.ProviderDetected = false;                
            });
            
        }
    },

    /**
     * Getter and setter for ProviderDetected
     * 
     * Might cause issues if the user uninstalls metamask and doesnt refresh the page after
     */
    _providerDetected: undefined,
    get ProviderDetected() {
        if(CACHE_ENABLED) return typeof sessionStorage.ProviderDetected !== 'undefined' ? sessionStorage.ProviderDetected == 'true' : false;
        else return typeof this._providerDetected !== 'undefined' ? this._providerDetected : false;
    },
    set ProviderDetected(value) {
        if(typeof value === 'boolean') {
            if(CACHE_ENABLED) { sessionStorage.ProviderDetected = value; }
            else { this._providerDetected = value; }
        }
    },


    _modalExists: false,
    modalDialog: `<div class="modal" tabindex="-1" style="display: block; border: 1px solid rgb(0, 0, 0);" aria-modal="true" role="dialog"><div class="modal-dialog modal-dialog-centered"><div class="modal-content" style="border: none;border-radius: 0;font-family: 'Poppins Regular';font-size: 14px;color: #000;letter-spacing: 1.2px;"><div class="modal-header" style="border: none;"><h5 class="modal-title">No ethereum wallet</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="opacity: 1;"></button></div><div class="modal-body" style=""><p>We did not detect an ethereum wallet in your browser.</p><p>Site functionalty will be limited.</p><p>If you wish to use all features, please install <b>Metamask</b>.</p></div><div class="modal-footer" style="border: none;"><button id="modal-button1" type="button" class="btn btn-primary" data-bs-dismiss="modal" style="border-style: solid;border-color: #000000;border-radius: 0px;font-size: 14px;font-family: 'Poppins Regular';line-height: 14.4px;letter-spacing: 1.2px;padding: 0px;margin: 0px;height: 30px;box-shadow: none; background-color:#fff; color:#000;width:200px">Visit metamask.io</button><button id="modal-button2" type="button" class="btn btn-primary" data-bs-dismiss="modal" style="border-style: solid;border-color: #000000;border-radius: 0px;font-size: 14px;font-family: 'Poppins Regular';line-height: 14.4px;letter-spacing: 1.2px;padding: 0px;margin: 0px;height: 30px;box-shadow: none; background-color:#fff; color:#000;width:200px;margin-left:10px;">Visit metamask.io</button></div></div></div></div>`,    
    /**
     * Show the bootstrap modal dialog
     * Dialog tells the user some basic information before connecting the site to metamask
     * 
     * @param {string} title 
     * @param {string} body 
     * @param {string} btn1Text 
     * @param {function} btn1Func 
     * @param {string} btn2Text 
     * @param {function} btn2Func 
     */
    LOGIN_showModalDialog: (title, body, btn1Text, btn1Func, btn2Text, btn2Func ) => {
        if(!Web3Wrapper._modalExists){
            //setup the modal window. function will only be called once
            const modalDom = document.createElement('div');
            modalDom.innerHTML = Web3Wrapper.modalDialog;
            $(modalDom).appendTo("body");
            
            Web3Wrapper._modalExists = true;
        }

        $('.modal-title').html(title);
        $('.modal-body').html(body);     
        
        if(typeof btn1Text !== 'undefined'){ $('.modal').find('#modal-button1').html(btn1Text); $('.modal').find('#modal-button1').removeClass('visually-hidden'); }
        else { $('.modal').find('#modal-button1').addClass('visually-hidden'); }

        $('#modal-button1').unbind( "click" );
        if(typeof btn1Func !== 'undefined'){ $('.modal').find('#modal-button1').click(btn1Func); }
        else { $('.modal').find('#modal-button1').click(() => {}); }
        

        if(typeof btn2Text !== 'undefined'){ $('.modal').find('#modal-button2').html(btn2Text); }
        else { $('.modal').find('#modal-button2').addClass('visually-hidden'); }

        $('#modal-button2').unbind( "click" );
        if(typeof btn2Func !== 'undefined'){ $('.modal').find('#modal-button2').click(btn2Func); $('.modal').find('#modal-button2').removeClass('visually-hidden'); }
        else { $('.modal').find('#modal-button2').click(() => {}); }
        

        $('.modal').modal('show');

    },

    /**
     * DEPRECATED
     * 
     * Check if user has already set ApprovalForAll, if not prompt the user to do so
     * 
     * Set cookies (if the user accepted them)
     * 
     * @param {string} selectedAddress 
     * @param {funtion} _callBack 
     */
    LOGIN_getApprovalForAll: (selectedAddress, _callBack) => {
        if(typeof selectedAddress !== 'undefined') {
            Web3Wrapper.isApprovedForAll(selectedAddress, (isApproved) => {
                if(isApproved) {

                    CookieFactory.setCookie('egram_accountConnected', 1, 30);
                    Web3Wrapper.IsFunctionalityLimited = false;      
                    if(typeof _callBack !== 'undefined') _callBack(true);

                } else {

                    Web3Wrapper.Provider.eth.ens.setApprovalForAll(Marketplace.Address, true, {from: selectedAddress})
                        .then( () => {
                            
                            CookieFactory.setCookie('egram_accountConnected', 1, 30);
                            Web3Wrapper.IsFunctionalityLimited = false;      
                            if(typeof _callBack !== 'undefined') _callBack(true);

                        })
                        .catch( (error) => {
                            console.error(error);
                            if(error.code === 4001){
                                //user denied
                                CookieFactory.removeCookie('egram_accountConnected');
                                if(typeof _callBack !== 'undefined') _callBack(false);
                            }
                            
                        });
                }
            });
        }

        if(typeof _callBack !== 'undefined') _callBack(false);
        
    },

    LOGIN: {},
    /**
     * Try to log the user in.
     * Requirements:
     * - Web3Wrapper.LOGIN.IsMetamaskInstalled
     * - Web3Wrapper.LOGIN.SelectedAddress
     * - Web3Wrapper.LOGIN.IsApprovedForAll
     */    
    LOGIN_tryLogin: () => {
        if(
            typeof Web3Wrapper.LOGIN.IsMetamaskInstalled !== 'undefined'  && 
            typeof Web3Wrapper.LOGIN.SelectedAddress !== 'undefined' && 
            typeof Web3Wrapper.LOGIN.IsApprovedForAll !== 'undefined'
        ) {
            if(Web3Wrapper.LOGIN.IsMetamaskInstalled === true) {
                if(typeof Web3Wrapper.SelectedAddress !== 'undefined' && Web3Wrapper.LOGIN.IsApprovedForAll === true) {
                    CookieFactory.setCookie('egram_accountConnected', 1, 30);
                    Web3Wrapper.IsFunctionalityLimited = false;
                    $(document).trigger('web3Connected');
                    updateConnectButton();
                } else {
                    CookieFactory.removeCookie('egram_accountConnected');
                }
            }

            Web3Wrapper.LOGIN = {};
        }
    },
 
    isAutoConnect: true,
    
    /**
     * Check if the @param user is ApprovedForAll
     * 
     * Show modal dialog if required.
     * 
     * If the user is not approved then website functionality will be limited
     * 
     * @param {string} user 
     */
    checkSetApproval: (user) => {
        if(typeof Web3Wrapper.IsApprovedForAll === 'undefined') {
            Web3Wrapper.isApprovedForAll( Web3Wrapper.SelectedAddress, (isApproved) => {
                Web3Wrapper.IsApprovedForAll = isApproved;
                Web3Wrapper.checkSetApproval(user);
            });
        } else {
            if(Web3Wrapper.IsApprovedForAll === true) {   
                if(typeof CookieFactory.Enabled !== 'undefined') {
                    CookieFactory.setCookie('egram_accountConnected', true);                
                }
                
                Web3Wrapper.IsFunctionalityLimited = false;                
                updateConnectButton();
            } else if (user) {
                Web3Wrapper.LOGIN_showModalDialog(
                    'Approval required', 
                    'To use the Emograms marketplace you need to grant permissions, in form of a smart-contract call, at the first time connecting MetaMask!', 
                    'Continue',
                        () => {
                            Web3Wrapper.setApprovalForAll(Web3Wrapper.SelectedAddress, (result) => {
                                if(result) {
                                    if(typeof CookieFactory.Enabled !== 'undefined') {
                                        CookieFactory.setCookie('egram_accountConnected', true);                
                                    }
                                    
                                    Web3Wrapper.IsFunctionalityLimited = false;                
                                    updateConnectButton();
                                }
                            })
                        }, 
                    'Cancel', 
                        () => { $('.modal').modal('hide') }
                );
            }
        }
        
        
        
    },
    
    /**
     * Connect the site to metamask.
     * Checks installed provider, approvalforall, cookies
     * Shows modal dialog if provider is not found
     * 
     * @param {string} user 
     */
    connectWeb3: (user) => {

        if(Web3Wrapper.IsMetamaskInstalled) {
            
            if(typeof Web3Wrapper.SelectedAddress !== 'undefined') {
                Web3Wrapper.checkSetApproval(user);
            } else if(user) {
                window.ethereum.request({ method: 'eth_requestAccounts' })
                    .then( (result) => { 
                        if(result.length > 0) { 
                            Web3Wrapper.SelectedAddress = result[0];
                            Web3Wrapper.checkSetApproval(user);                                   
                        }                        
                        
                    })
                    .catch( (error) => {                         
                        if(error.code !== 4001) {
                            console.error(error);
                        }
                        if(typeof CookieFactory.Enabled !== 'undefined') { CookieFactory.removeCookie('egram_accountConnected'); }
                        
                });
            }
        } else {
            Web3Wrapper.LOGIN_showModalDialog(
                'No ethereum wallet', 
                '<p>We did not detect an ethereum wallet in your browser.</p><p>Site functionalty will be limited.</p><p>If you wish to use all features, please install <b>Metamask</b>.</p>',
                'Visit metamask.io',
                () => {window.open("https://metamask.io/", "_blank")}
            );
        }
    },

    IsMetamaskInstalled: undefined,
    IsApprovedForAll : undefined,

    /**
     * getter and setter for SelectedAddres in metamask
     */
    _selectedAddress: undefined,
    get SelectedAddress() {
        if(CACHE_ENABLED) return typeof sessionStorage.SelectedAddress !== 'undefined' ? sessionStorage.SelectedAddress : undefined;       
        else return typeof this._selectedAddress !== 'undefined' ? this._selectedAddress  : undefined;
    },
    set SelectedAddress(value) {
        if(typeof value !== 'undefined') {
            if(CACHE_ENABLED) { sessionStorage.SelectedAddress = value; }
            else { this._selectedAddress = value; }
        }
    },

    /**
     * getter and setter for current LibraryFilter
     */
    _libraryFilter: null,
    get LibraryFilter() {
        return typeof sessionStorage.LibraryFilter !== 'undefined' ? sessionStorage.LibraryFilter : undefined;
    },
    set LibraryFilter(value) {
        if(typeof value !== 'undefined') { sessionStorage.LibraryFilter = value; }
    },

    /**
     * Call functions required for the user to login/connect to web3
     * 
     * @param {function} _callBack 
     */
    loadRequiredInfo: (_callBack) => {       
        //load is metamask installed, selected address        
        Web3Wrapper.getIsMetamaskInstalled((isMetamaskInstalled) => {             
            Web3Wrapper.IsMetamaskInstalled = isMetamaskInstalled;
            Web3Wrapper.getSelectedAddress( (selectedAddress) => {
                Web3Wrapper.SelectedAddress = selectedAddress;
                if(typeof Web3Wrapper.SelectedAddress !== 'undefined') {
                    Web3Wrapper.isApprovedForAll( selectedAddress, (isApproved) => {
                        Web3Wrapper.IsApprovedForAll = isApproved;
                        
                        if(typeof _callBack !== 'undefined') { _callBack(); }
                    });
                } else {
                    if(typeof _callBack !== 'undefined') { _callBack(); }
                }

            });
        });
    },

    /**
     * Check if user is approved for all
     * 
     * @param {string} selectedAddress 
     * @param {function} _callBack 
     */
    isApprovedForAll: (selectedAddress, _callBack) => {        
        Collectibles.Contract.methods.isApprovedForAll(Web3Wrapper.Provider.utils.toChecksumAddress(selectedAddress), Marketplace.ProxyAddress).call()
        .then((isApproved) => { if(typeof _callBack !== 'undefined') _callBack(isApproved); })
        .catch((error) => { console.error(error); if(typeof _callBack !== 'undefined') _callBack(false); });
    },

    /**
     * Calls the setApprovalForAll contract method (if the user is not approved yet)
     * 
     * @param {string} selectedAddress 
     * @param {function} _callBack 
     */
    setApprovalForAll: (selectedAddress, _callBack) => {

        Web3Wrapper.isApprovedForAll(Web3Wrapper.Provider.utils.toChecksumAddress(selectedAddress), (isApproved) => {
            if(!isApproved) {
                Collectibles.Contract.methods.setApprovalForAll(Marketplace.ProxyAddress, true).send({from: Web3Wrapper.Provider.utils.toChecksumAddress(selectedAddress)}).then((result) => {
                    if(typeof _callBack !== 'undefined'){ _callBack(true); }
                }).catch((error) => {
                    console.error(error);
                    _callBack(false);
                });
            } else {
                _callBack(true);
            }
        });
    },

    /**
     * Check if the user accepted cookies and has logged in previously
     * 
     * @returns {boolean}
     */
    checkConnectedAccount: () => {
        try {
            const cookie = CookieFactory.getCookie('eth_connectedAccount');
            if(typeof cookie !== 'undefined'){
                return true;
            }
        } catch (error) {
            return false;
        }
    },

    /**
     * Creates:
     * - Web3Wrapper.Provider object
     * - Marketplace.Contract object
     * - Collectibles.Contract object
     * 
     * Triggers the contractsCreated event when done
     * 
     * @returns {boolean}
     */
    initializeContracts: () => {
        if(Web3Wrapper.Provider == null){ 
            try {
                Web3Wrapper.Provider = Web3Wrapper.IsMetamaskInstalled ? new Web3(window.ethereum) : new Web3(Web3Wrapper.GetWeb3Host);
                
            } catch(e) {
                console.error(e);

            }
        }

        if(Marketplace.Contract == null){                       
            if(Marketplace.ABI !== null) {
                Marketplace.Contract = new Web3Wrapper.Provider.eth.Contract(Marketplace.ABI, Marketplace.ProxyAddress);    
            } else {
                console.error('Failed to create Marketplace contract');
            }
        }
        
        if(Collectibles.Contract == null){                       
            if(Collectibles.ABI !== null) {                                                   
                try {                
                    Collectibles.Contract = new Web3Wrapper.Provider.eth.Contract(Collectibles.ABI, Collectibles.Address);               
                } catch(e) {
                    console.error(e);
                    
                }                
            } else {
                console.error('Failed to create Collectibles contract');
                
            }
        }             

        if(typeof _callBack !== 'undefined') {                
            _callBack();                
        }

        $(document).trigger('contractsCreated');

        return true;

    },

    /**
     * Get transaction details using transactionHash
     * 
     * @param {object} event 
     * @param {function} _callBack 
     */
    getTransaction: (event, _callBack) => {
        Web3Wrapper.Provider.eth.getTransaction(event.transactionHash).then((result) => {
            result.eventName = event.event;
            _callBack(event, result);
        });
    },

    /**
     * Subscribe to Solidity contract events using Marketplace.subscribeEvent function     * 
     * Events are used to update Collectibles.Emograms list
     */
    subscribeContractEvents: () => {
        //emogram added to marketplace (fixed price)
        //event EmogramAdded(uint256 indexed id, uint256 indexed tokenId, address indexed tokenAddress, uint256 askingPrice);
        Marketplace.subscribeEvent('EmogramAdded', (result)=> {
            let payload = result.Result;

            let tokenId = payload.returnValues.tokenId; 
            let saleId = payload.returnValues.id;
            let askingPrice = payload.returnValues.askingPrice;
            let saleData = new EmogramSale(saleId, askingPrice);           
   
            if(typeof eventNameMapping['EmogramAdded'] !== 'undefined') {   
                Collectibles.updateEmograms(tokenId, undefined, undefined, true, undefined, undefined, saleData, 
                    new EmogramHistoryEvent('EmogramAdded', askingPrice, undefined, undefined, payload.transactionHash, payload.blockNumber)
                );     
            } else {
                Collectibles.updateEmograms(tokenId, undefined, undefined, true, undefined, undefined, saleData, undefined);
            }
            
            Collectibles.updateSaleArrayItem('EmogramAdded', payload.returnValues.id, payload.returnValues.tokenAddress, payload.returnValues.tokenId, payload.returnValues.askingPrice);
        });

        //emogram sale cancelled
        //event SellCancelled(address indexed sender, address indexed tokenAddress, uint256 indexed tokenId);
        Marketplace.subscribeEvent('SellCancelled', (result)=> {
            let payload = result.Result;

            let tokenId = payload.returnValues.tokenId;           
   
            if(typeof eventNameMapping['SellCancelled'] !== 'undefined') {   
                Collectibles.updateEmograms(tokenId, undefined, undefined, false, undefined, undefined, [],
                    new EmogramHistoryEvent('SellCancelled', undefined, undefined, undefined, payload.transactionHash, payload.blockNumber)
                );     
            } else {
                Collectibles.updateEmograms(tokenId, undefined, undefined, false, undefined, undefined, undefined, undefined);
            }

            Collectibles.updateSaleArrayItem('SellCancelled', undefined, payload.returnValues.tokenAddress, payload.returnValues.tokenId, undefined);
        });

        //emogram sold as fixed price
        //event EmogramSold (uint256 indexed id, uint256 indexed tokenId, address indexed buyer, uint256 askingPrice);
        Marketplace.subscribeEvent('EmogramSold', (result)=> {
            let payload = result.Result;

            let newOwner = payload.returnValues.buyer;
            let tokenId = payload.returnValues.tokenId;

            if(typeof eventNameMapping['EmogramSold'] !== 'undefined') {   
                Collectibles.updateEmograms(tokenId, undefined, newOwner, false, undefined, undefined, [], 
                    new EmogramHistoryEvent('EmogramSold', payload.returnValues.askingPrice, payload.returnValues.seller, newOwner, payload.transactionHash, payload.blockNumber)
                );     
            } else {
                Collectibles.updateEmograms(tokenId, undefined, newOwner, false, undefined, undefined, undefined, undefined);
            }

            Collectibles.updateSaleArrayItem('EmogramSold', payload.returnValues.id, undefined, payload.returnValues.tokenId, payload.returnValues.askingPrice);
        });

        //new auction created
        //event AuctionCreated(uint256 indexed id, uint256 indexed tokenId, address indexed seller, address tokenAddress, uint256 startPrice, uint256 duration);
        Marketplace.subscribeEvent('AuctionCreated', (result)=> {                
            let payload = result.Result;
            let tokenId = payload.returnValues.tokenId;

            let auctionId = payload.returnValues.id;            
            let startPrice = payload.returnValues.startPrice;
            let duration = payload.returnValues.duration;
            
            let auctionData = new EmogramAuction(auctionId, startPrice, undefined, undefined, undefined, duration);

            if(typeof eventNameMapping['AuctionCreated'] !== 'undefined') {   
                Collectibles.updateEmograms(tokenId, undefined, undefined, undefined, true, auctionData, undefined, 
                    new EmogramHistoryEvent('AuctionCreated', startPrice, undefined, undefined, payload.transactionHash, payload.blockNumber)
                );  
            } else {
                Collectibles.updateEmograms(tokenId, undefined, undefined, undefined, true, auctionData, undefined, undefined);
            }  

            Collectibles.updateAuctionArrayItem('AuctionCreated', payload.returnValues.id, payload.returnValues.tokenAddress, payload.returnValues.tokenId, payload.returnValues.seller, undefined, payload.returnValues.startPrice, undefined, payload.returnValues.duration);
        });

        //auction was cancelled without selling
        //event AuctionCanceled(uint256 indexed id, uint256 indexed tokenId, address indexed seller, address tokenAddress);
        Marketplace.subscribeEvent('AuctionCanceled', (result)=> {    
            let payload = result.Result;        
            let tokenId = payload.returnValues.tokenId;

            if(typeof eventNameMapping['AuctionCanceled'] !== 'undefined') {   
                Collectibles.updateEmograms(tokenId, undefined, undefined, undefined, false, [], undefined, 
                    new EmogramHistoryEvent('AuctionCanceled', undefined, undefined, undefined, payload.transactionHash, payload.blockNumber)
                );     
            } else {
                Collectibles.updateEmograms(tokenId, undefined, undefined, undefined, false, [], undefined, undefined);
            }  
            
            Collectibles.updateAuctionArrayItem('AuctionCanceled', payload.returnValues.id, payload.returnValues.tokenAddress, payload.returnValues.tokenId, payload.returnValues.seller, undefined, undefined, undefined, undefined);
        });

        //new highest bid
        //event BidPlaced(uint256 indexed id, uint256 indexed tokenId, address indexed bidder, uint256 bid);
        Marketplace.subscribeEvent('BidPlaced', (result)=> {   
            let payload = result.Result;            
            let tokenId = payload.returnValues.tokenId;
            
            const index = Collectibles.Emograms.findIndex(em => em.Id.toString() == tokenId.toString());            
            Collectibles.Emograms[index].AuctionData.HighestBid = payload.returnValues.bid;
            Collectibles.Emograms[index].AuctionData.HighestBidder = payload.returnValues.bidder;
            let auctionData = Collectibles.Emograms[index].AuctionData;
            if(typeof eventNameMapping['BidPlaced'] !== 'undefined') {   
                Collectibles.updateEmograms(tokenId, undefined, undefined, undefined, undefined, auctionData, undefined, 
                    new EmogramHistoryEvent('BidPlaced', payload.returnValues.bid, payload.returnValues.bidder, undefined, payload.transactionHash, payload.blockNumber)
                );    
            } else {
                Collectibles.updateEmograms(tokenId, undefined, undefined, undefined, undefined, auctionData, undefined, undefined);
            }

            Collectibles.updateAuctionArrayItem('BidPlaced', payload.returnValues.id, undefined, payload.returnValues.tokenId, undefined, payload.returnValues.bidder, undefined , payload.returnValues.bid, undefined);
        });

        //auction ended with a new owner
        //event AuctionFinished(uint256 indexed id, uint256 indexed tokenId, address indexed highestBidder, address seller, uint256 highestBid);
        Marketplace.subscribeEvent('AuctionFinished', (result)=> {     
            let payload = result.Result;                  
            let tokenId = payload.returnValues.tokenId;
            let newOwner = payload.returnValues.highestBidder;
            
            if(typeof eventNameMapping['AuctionFinished'] !== 'undefined') {   
                Collectibles.updateEmograms(tokenId, undefined, newOwner, undefined, false, undefined, undefined, 
                    new EmogramHistoryEvent('AuctionFinished', payload.returnValues.highestBid, payload.returnValues.seller, newOwner, payload.transactionHash, payload.blockNumber)
                );    
            } else {
                Collectibles.updateEmograms(tokenId, undefined, newOwner, undefined, false, undefined, undefined, undefined);
            } 
            
            Collectibles.updateAuctionArrayItem('AuctionFinished', payload.returnValues.id, undefined, payload.returnValues.tokenId, payload.returnValues.seller, payload.returnValues.highestBidder, undefined, payload.returnValues.highestBid, undefined);
        });

        Marketplace.subscribeEvent('TransferSingle', (result)=> {       
            let payload = result.Result; 
            let tokenId = payload.returnValues.id;
            let newOwner = payload.returnValues.to;            

            if(typeof eventNameMapping['TransferSingle'] !== 'undefined') {   
                Collectibles.updateEmograms(tokenId, undefined, newOwner, undefined, undefined, undefined, undefined, 
                    new EmogramHistoryEvent('TransferSingle', undefined, payload.returnValues.from, newOwner, payload.transactionHash, payload.blockNumber)
                );    
            } else {
                Collectibles.updateEmograms(tokenId, undefined, newOwner, undefined, undefined, undefined, undefined, undefined);
            } 

        });
    },

    /**
     * Get ethereum balance of the active metamask address
     * 
     * @param {function} _callBack 
     */
    getEthBalance: (_callBack) => {
        Web3Wrapper.Provider.eth.getBalance(Web3Wrapper.SelectedAddress).then( (result) => { _callBack(result); });
    },

    /**
     * Getter and Setter for subscribed events array
     */
    _subscribedEvents: [],
    get SubscribedEvents() {
        return this._subscribedEvents;
    },
    set SubscribedEvents(value) {
        if(typeof value !== 'undefined') { this._subscribedEvents = value; }
    },
};

/**
 * JS Wrapper for the Collectibles contract
 */
let Collectibles = {
    ABI: null,
    Address: Web3Wrapper.GetCollectiblesAddress,
    Contract: null,
    SRT_ID: 1,
    EMOGRAM_ID: Array.from(new Array(99), (_, i) => i + 2),    
    SRTCount: null,
    EmogramCount: null,
    Emograms: null,

    /**
     * Update Emogram in Collectibles.Emograms
     * Create EmogramChanged and trigger the emogramsChanged event
     * 
     * @param {number} id 
     * @param {string} name 
     * @param {string} owner 
     * @param {boolean} isOnSale 
     * @param {boolean} isOnAuction 
     * @param {list} auctionData 
     * @param {list} saleData 
     * @param {list} history 
     * @returns 
     */
    updateEmograms: (id, name, owner, isOnSale, isOnAuction, auctionData, saleData, history) => {

        if(typeof id == 'undefined' || id == null) { 
            return;
        } else {
            const index = Collectibles.Emograms.findIndex(element => element.Id == id);

            if(index !== -1) {
                let payload = new EmogramChanged(Collectibles.Emograms[index].Id);

                if(typeof name !== 'undefined') { Collectibles.Emograms[index].Name = name; payload.NameChanged = true; }
                if(typeof owner !== 'undefined') { Collectibles.Emograms[index].Owner = owner; payload.OwnerChanged = true;}
                if(typeof isOnSale !== 'undefined') { Collectibles.Emograms[index].IsOnSale = isOnSale; payload.OnSaleChanged = true; }
                if(typeof isOnAuction !== 'undefined') { Collectibles.Emograms[index].IsOnAuction = isOnAuction; payload.OnAuctionChanged = true;}            
                if(typeof auctionData !== 'undefined') { 
                
                    payload.AuctionDataChanged = true; 
    
                    if (typeof Collectibles.Emograms[index].AuctionData.AuctionId === 'undefined') {
                        Collectibles.Emograms[index].AuctionData = auctionData;  
                    } else {
                        if(auctionData.length == 0) {
                            Collectibles.Emograms[index].AuctionData = [];
                        } else {
                            Collectibles.Emograms[index].AuctionData.EndTimestamp = typeof auctionData.EndTimestamp !== 'undefined' ? auctionData.EndTimestamp : Collectibles.Emograms[index].AuctionData.EndTimestamp ;
                            Collectibles.Emograms[index].AuctionData.HighestBid = typeof auctionData.HighestBid !== 'undefined' ? auctionData.HighestBid : Collectibles.Emograms[index].AuctionData.HighestBid ;
                            Collectibles.Emograms[index].AuctionData.HighestBidder = typeof auctionData.HighestBidder !== 'undefined' ? auctionData.HighestBidder : Collectibles.Emograms[index].AuctionData.HighestBidder ;
                            Collectibles.Emograms[index].AuctionData.StartPrice = typeof auctionData.StartPrice !== 'undefined' ? auctionData.StartPrice : Collectibles.Emograms[index].AuctionData.StartPrice ;
                        }
                        
                    }
                    
                    
                }
                if(typeof saleData !== 'undefined') { Collectibles.Emograms[index].SaleData = saleData; payload.SaleDataChanged = true; }
                if(typeof history !== 'undefined') { Collectibles.Emograms[index].History.push(history); payload.HistoryChanged = true; } 

                if(
                    payload.NameChanged || 
                    payload.OwnerChanged || 
                    payload.OnSaleChanged || 
                    payload.OnAuctionChanged || 
                    payload.AuctionDataChanged || 
                    payload.SaleDataChanged || 
                    payload.HistoryChanged
                ) { 
                    //refill the sessionStorage
                    if(CACHE_ENABLED) sessionStorage.Emograms = JSON.stringify(Collectibles.Emograms);
            
                }   
                
                $(document).trigger('emogramsUpdated', [JSON.stringify(payload)]);
            }

        }   

    },


    /**
     * Get the amount of SRT tokens held by the currently selected account in Metamask
     * 
     * @param {function} _callBack 
     */
    getAccountSRTCount: (_callBack) => {
        if(typeof Web3Wrapper.SelectedAddress !== 'undefined' && typeof Collectibles.SRT_ID !== 'undefined') {
            try {
                Collectibles.Contract.methods.balanceOf(Web3Wrapper.SelectedAddress, Collectibles.SRT_ID).call()
                    .then((result) => { Collectibles.SRTCount = result; if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', Collectibles.SRTCount)) })
                    .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get number of owned emograms.')); });
            } catch (error) {
                if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get owned SRT count.'));
            } 
        } else {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', `Undefined parameters in 'getAccountSRTCount' function call.\nWeb3Wrapper.SelectedAddress: ${Web3Wrapper.SelectedAddress}\nCollectibles.SRT_ID: ${Collectibles.SRT_ID}`, 'Undefined parameters in function call.'));
        }
        
    },

    /**
     * Get the amount of emograms held by the currently selected account in Metamask
     * 
     * @param {function} _callBack 
     */
    getAccountEmogramCount: (_callBack) => {
        if(typeof Web3Wrapper.SelectedAddress !== 'undefined' && typeof Collectibles.EMOGRAM_ID !== 'undefined') {
            try {
                Collectibles.Contract.methods.balanceOfBatch(toArrayWithLength(Web3Wrapper.SelectedAddress, Collectibles.EMOGRAM_ID.length), Collectibles.EMOGRAM_ID).call()
                    .then((result) => { Collectibles.EmogramCount = result.reduce((sum, value) => { return sum + parseInt(value); }, 0); if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', Collectibles.EmogramCount)) })
                    .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get number of owned emograms.')); });
            } catch (error) {
                if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get number of owned emograms.'));
            } 
        } else {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', `Undefined parameters in 'getAccountEmogramCount' function call.\nWeb3Wrapper.SelectedAddress: ${Web3Wrapper.SelectedAddress}\nCollectibles.EMOGRAM_ID: ${Collectibles.EMOGRAM_ID}`, 'Undefined parameters in function call.'));
        }
    },

    /**
     * Get all emograms from Collectibles contract and add them to Collectibles.Emograms
     * emogramAddedToArray event is triggered for each emogram
     * emogramsLoaded event is triggered after all of the emograms have been added
     * @param {array} tokenIdArray 
     */
    getEmogramList: (tokenIdArray) => {
        Collectibles.Emograms = typeof sessionStorage.Emograms !== 'undefined' ? JSON.parse(sessionStorage.Emograms) : []; 


        if(typeof Collectibles.Emograms !== 'undefined') {
            Collectibles.Emograms.forEach(emogram => {
                $(document).trigger('emogramAddedToArray', [JSON.stringify(emogram)]);
            });
        }

        let arrayToUse = [];
        let loadedEmograms = typeof sessionStorage.LoadedEmograms !== 'undefined' ? JSON.parse(sessionStorage.LoadedEmograms) : [];
        
        if(CACHE_ENABLED) {
            if(typeof tokenIdArray !== 'undefined' && tokenIdArray.constructor.name == 'Array'){            
                //merge the 2 arrays (tokenIdArray items are at the front) then remove duplicates using the Set contructor
                arrayToUse = [...new Set(tokenIdArray.join(',').split(',').map(Number).concat(Collectibles.EMOGRAM_ID))].filter(x => loadedEmograms.indexOf(x) == -1);            
            } else {
                //only load the ones that we havent loaded already
                arrayToUse = Collectibles.EMOGRAM_ID.filter( x => loadedEmograms.indexOf(x) == -1);
            }
        } else {            
            if(typeof tokenIdArray !== 'undefined' && tokenIdArray.constructor.name == 'Array'){   
                arrayToUse = tokenIdArray;                         
            } else {                
                arrayToUse = Collectibles.EMOGRAM_ID;
            }
        }

        arrayToUse.forEach(tokenId => {
            getEmogramData(tokenId, (emogram) => {  
                Collectibles.Emograms.push(emogram);
                //check if caching is enabled

                loadedEmograms.push(emogram.Id);  

                if(CACHE_ENABLED) {
                    sessionStorage.Emograms = JSON.stringify(Collectibles.Emograms) ;
                    sessionStorage.LoadedEmograms = JSON.stringify(loadedEmograms);
                }                              
                
                //trigger the single emogram added event with the emogram as payload
                $(document).trigger('emogramAddedToArray', [JSON.stringify(emogram)]);
            });
        });        

        if(CACHE_ENABLED && Collectibles.Emograms.length == Collectibles.EMOGRAM_ID.length) {
            //we loaded all the emograms
            Collectibles.Emograms.sort( (a, b) => {
                return a.Id - b.Id;
            });    
            $(document).trigger('emogramsLoaded');
        }


    },

    /*
    struct sellItem {
        uint256 sellId;
        address tokenAddress;
        uint256 tokenId;
        address payable seller;
        uint256 price;
        bool isSold;
    }
    updateSaleArrayItem('EmogramAdded', id, tokenAddress, tokenId, undefined, askingPrice);
    updateSaleArrayItem('SellCancelled', undefined, tokenAddress, tokenId, sender, undefined);
    updateSaleArrayItem('EmogramSold', id, undefined, tokenId, seller, askingPrice);
    */
    _saleArray: null,
    get SaleArray() {        
        if(CACHE_ENABLED) return typeof sessionStorage.SaleArray !== 'undefined' ? JSON.parse(sessionStorage.SaleArray) : undefined;
        else return this._saleArray !== null ? this._saleArray : undefined;
    },
    set SaleArray(value) {
        if(CACHE_ENABLED) { if(typeof value !== 'undefined') { sessionStorage.SaleArray = JSON.stringify(value); } }
        else { this._saleArray = value; }
    },    
    SaleArrayPush(value){
        let saleArrayItem = new SaleArrayItem(value);

        let array = this.SaleArray !== 'undefined' ? this.SaleArray : [];

        if(!saleArrayItem.IsNulled()) {
            array.push(saleArrayItem);
            this.SaleArray = array;
        }
           
    },    

    /**
     * Update a specific sale 
     * 
     * If eventName is EmogramAdded then create a new sale
     * If eventName is SellCancelled or EmogramSold then end the sale
     * 
     * @param {string} eventName 
     * @param {number} sellId 
     * @param {string} tokenAddress 
     * @param {number} tokenId 
     * @param {number} askingPrice 
     */
    updateSaleArrayItem: (eventName, sellId, tokenAddress, tokenId, askingPrice) => {

        if(eventName == 'EmogramAdded') {
            let saleArrayItem = {            
                sellId: sellId, 
                tokenAddress: tokenAddress, 
                tokenId: tokenId, 
                price: askingPrice,
                isSold: false
            };

            Collectibles.SaleArrayPush(saleArrayItem);
        } else if(eventName == 'SellCancelled' || eventName == 'EmogramSold') {

            let index = Collectibles.SaleArray.map((e) => { return e.TokenId}).indexOf(tokenId + '');
            let tmp = Collectibles.SaleArray;

            if(index !== -1) {                 
                tmp[index].IsOnSale = false;    
                Collectibles.SaleArray = tmp;  
            } else {
                console.error(`Tried to end a non-existent Sale with event '${eventName}'.`);
            }
        }

    },
    
    /*
    struct auctionItem {
        uint256 auctionId;
        address tokenAddress;
        uint256 tokenId;
        address payable seller;
        address payable highestBidder;
        uint256 startPrice;
        uint256 highestBid;
        uint256 endDate;
        bool onAuction;
    }
    updateAuctionArrayItem('BidPlaced', id, tokenId, undefined, tokenId, undefined, bidder, undefined, bid, undefined);
    updateAuctionArrayItem('AuctionCreated', id, tokenAddress, tokenId, seller, undefined, startPrice, undefined, duration);
    updateAuctionArrayItem('AuctionCanceled', id, tokenAddress, tokenId, seller, undefined, undefined, undefined, undefined);
    updateAuctionArrayItem('AuctionFinished', id, undefined, tokenId, seller, highestBidder, undefined, highestBid, undefined);
    updateAuctionArrayItem('InitialAuctionSale', id, undefined, tokenid, undefined, highestBidder, undefined, highestBid, undefined);
    */   
    _auctionArray: null,
    get AuctionArray() {     
        if(CACHE_ENABLED) return typeof sessionStorage.AuctionArray !== 'undefined' ? JSON.parse(sessionStorage.AuctionArray) : undefined;
        else return this._auctionArray !== null ? this._auctionArray : undefined;
    },
    set AuctionArray(value) {
        if(CACHE_ENABLED) { if(typeof value !== 'undefined') { sessionStorage.AuctionArray = JSON.stringify(value); } }
        else { this._auctionArray = value; }
    },
    AuctionArrayPush(value){          
        let auctionArrayItem = new AuctionArrayItem(value);    

        let array = this.AuctionArray !== 'undefined' ? this.AuctionArray : [];

        if(!auctionArrayItem.IsNulled()) {
            array.push(auctionArrayItem);
            this.AuctionArray = array;
        }
                
    },

    /**
     * Update a specific Auction
     * 
     * If eventName is AuctionCreated then create a new auction
     * If eventName is BidPlaced then update the current HighestBid
     * 
     * @param {string} eventName 
     * @param {number} auctionId 
     * @param {string} tokenAddress 
     * @param {number} tokenId 
     * @param {string} seller 
     * @param {string} highestBidder 
     * @param {number} startPrice 
     * @param {number} highestBid 
     * @param {DateTime} endDate 
     */
    updateAuctionArrayItem: (eventName, auctionId, tokenAddress, tokenId, seller, highestBidder, startPrice, highestBid, endDate) => {
        if(eventName === 'AuctionCreated') {
            let auctionArrayItem = {            
                auctionId: auctionId, 
                tokenAddress: tokenAddress, 
                tokenId: tokenId, 
                seller: seller, 
                highestBidder: highestBidder,
                startPrice: startPrice,
                highestBid: highestBid,
                endDate: endDate,
                onAuction: true
            };

            Collectibles.AuctionArrayPush(auctionArrayItem);
        } else {
            let index = Collectibles.AuctionArray.map((e) => { return e.TokenId}).indexOf(tokenId + '');
            let tmp = Collectibles.AuctionArray;
            if(index !== -1) { 
                switch(eventName) {
                    case 'BidPlaced':
                        tmp[index].HighestBid = highestBid;
                        tmp[index].HighestBidder = highestBidder;
                        Collectibles.AuctionArray = tmp;
                        break;
                    default:                        
                        tmp[index].OnAuction = false;    
                        Collectibles.AuctionArray = tmp;            
                        break;
                }                
            } else {
                console.error(`Tried to update a non-existent Auction with event '${eventName}'.`);              
            }
        }
    },

    /**
     * Get saleArray from Marketplace contract
     * 
     * @param {function} _callBack 
     */
    getSaleArray: (_callBack) => {        
        try {
            Marketplace.Contract.methods.getSaleArray().call()
                .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get active sale list.')); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get active sale list.'));
        }  
    },

    /**
     * Get auctionArray from Marketplace contract
     * 
     * @param {function} _callBack 
     */
    getAuctionArray: (_callBack) => {
        try {
            Marketplace.Contract.methods.getAuctionArray().call()
                .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get active auction list.')); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get active auction list.'));
        }           
    },


    /**
     * Get past events based on event name and emogramId from Collectibles contract
     * Results are filtered by emogramId
     * 
     * @param {number} emogramId
     * @param {string} eventName
     * @param {function} _callBack 
     */
    getPastEvents: (emogramId, eventName, _callBack) => {
        if(typeof emogramId !== 'undefined' && typeof eventName !== 'undefined') {
            let options = {
                filter: {tokenId: emogramId},
                fromBlock: 0,
                toBlock: 'latest'
            }
            try {
                Collectibles.Contract.getPastEvents(eventName, options)
                    .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result.filter(x => x.returnValues.id.toString() == emogramId.toString()))); })
                    .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get past events.')); });
            } catch (error) {
                if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get past events.'));
            }            
        } else {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', `Missing arguments in 'getPastEvents' function call.\nemogramId: ${emogramId}\neventName: ${eventName}`, 'Missing arguments in function call.'));
        }
        
    },
    
    /**
     * Get details of specific emogram from Collectibles.Emograms
     * 
     * @param {number} id 
     * @param {function} _callBack 
     * @returns 
     */
    getEmogramDetails: (id, _callBack) => {
        if(Collectibles.Emograms !== null && typeof id !== 'undefined') {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', Collectibles.Emograms[Collectibles.EMOGRAM_ID.indexOf(id)]));
            else return Collectibles.Emograms[Collectibles.EMOGRAM_ID.indexOf(id)];
        }
    },

    /**
     * Check if the active address in Metamask is the owner of the specific Emogram
     * 
     * @param {number} emogramId 
     * @param {function} _callBack 
     */
    isOwner: (emogramId, _callBack) => {
        try {
            Collectibles.Contract.methods.balanceOf(Web3Wrapper.SelectedAddress, emogramId).call()
                .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result == '1')); })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to determine ownership.')); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to determine ownership.'));
        }
        
    },

    /**
     * Get current sale status of the specific emogram
     * 
     * @param {number} emogramId 
     * @param {function} _callBack 
     */
    getSaleStatus: (emogramId, _callBack) => {
        try {
            Marketplace.getOnSale(emogramId, (onSale) => {
                Marketplace.getOnAuction(emogramId, (onAuction) => {
                    //TODO: update the callback on caller side
                    if( typeof _callBack !== undefined ) _callBack(onSale, onAuction);
                });
            });    
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get sale status.'));
        }
        
    },

    TokenJSON: null,
    /**
     * Get the IPFS json for the specific emogram
     * If TokenJSON is null, then first set it with an AJAX request
     * 
     * @param {number} emogramId 
     * @param {function} _callBack 
     */
    getUri: (emogramId, _callBack) => {
        try {
            if(Collectibles.TokenJSON === null) {
                $.getJSON( `https://cloudflare-ipfs.com/ipfs/QmboyrChGcD6BoThBXqCRDNxp56HFJJ7i6LNqnyrtKi8Ea/0` , {})
                    .done((data) => {
                        Collectibles.TokenJSON = data;                    
                        if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', Collectibles.TokenJSON[emogramId]));
                    }).catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get URI.')); })
            } else {
                if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', Collectibles.TokenJSON[emogramId]));
            }  
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get URI.'));
        }
    },

    /**
     * Get current owner of specific emogram
     * 
     * @param {number} emogramId 
     * @param {function} _callBack 
     */
    ownerOfById: (emogramId, _callBack) => {
        try {
            Collectibles.Contract.methods.ownerOfById(emogramId).call()
                .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get owner.')); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get the owner.'));
        }  
    },

    /**
     * !! NOT YET FULLY IMPLEMENTED !!
     * 
     * Redeem emogram sculpture.
     * Most of the logic is handled in the contract
     * 
     * @param {number} emogramId 
     * @param {function} _callBack 
     */
    redeemSculpture: (emogramId, _callBack) => {
        try {
            Collectibles.Contract.methods.redeemSculp(emogramId).call({from: Web3Wrapper.SelectedAddress})
                .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not redeem sculpture.')); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not redeem sculpture.'));
        } 
    }

}

/**
 * JS Wrapper for the Marketplace contract
 */
let Marketplace = { 
    ABI: null,
    Address: Web3Wrapper.GetMarketplaceAddress,
    Contract: null,
    ProxyAddress: Web3Wrapper.GetMarketplaceProxyAddress,
    OnSale: null,
    OnAuction: null,
    _isInitialAuctionPeriod: null,
    _initialAuctionCycle: null,

    /**
     * Get currently active initial auctions
     * 
     * @param {function} _callBack 
     * @returns list of active initialAuctions if a callback function is not set
     */
    getInitialAuction: (_callBack) => {
        let initialAuction = {};        

        if( Marketplace._isInitialAuctionPeriod === null ||  Marketplace._initialAuctionCycle === null) {
            Marketplace.Contract.methods.initialAuction().call().then((result) => {
                Marketplace._isInitialAuctionPeriod = result.isInitialAuction;
                Marketplace._initialAuctionCycle = result.cycle;

                initialAuction = { IsInitialAuction:  Marketplace._isInitialAuctionPeriod, Cycle:  Marketplace._initialAuctionCycle };

                if(typeof _callBack !== 'undefined') {
                    _callBack(initialAuction);                
                } else {
                    return initialAuction;
                }
            });
        }

        initialAuction = { IsInitialAuction:  Marketplace._isInitialAuctionPeriod, Cycle:  Marketplace._initialAuctionCycle };

        if(typeof _callBack !== 'undefined') {
            _callBack(initialAuction);                
        } else {
            return initialAuction;
        }

    },

    /**
     * Subscribe to specific contract event
     * 
     * @param {string} eventName 
     * @param {function} _callBack 
     */
    subscribeEvent: (eventName, _callBack) => {

        Web3Wrapper.SubscribedEvents;

        switch(eventName) {
            case "EmogramAdded": Marketplace.Contract.events.EmogramAdded({}, (error, result) => { Marketplace.subscribeEventCallback(error, result, eventName, _callBack); }); break;                
            case "EmogramSold": Marketplace.Contract.events.EmogramSold({}, (error, result) => { Marketplace.subscribeEventCallback(error, result, eventName, _callBack); }); break;                
            case "SellCancelled": Marketplace.Contract.events.SellCancelled({}, (error, result) => { Marketplace.subscribeEventCallback(error, result, eventName, _callBack); }); break;
            case "BidPlaced": Marketplace.Contract.events.BidPlaced({}, (error, result) => { Marketplace.subscribeEventCallback(error, result, eventName, _callBack); }); break;                
            case "AuctionCreated": Marketplace.Contract.events.AuctionCreated({}, (error, result) => { Marketplace.subscribeEventCallback(error, result, eventName, _callBack); }); break;                
            case "AuctionCanceled": Marketplace.Contract.events.AuctionCanceled({}, (error, result) => { Marketplace.subscribeEventCallback(error, result, eventName, _callBack); }); break;                
            case "AuctionFinished": Marketplace.Contract.events.AuctionFinished({}, (error, result) => { Marketplace.subscribeEventCallback(error, result, eventName, _callBack); }); break;                
            case "InitialAuctionSale": Marketplace.Contract.events.InitialAuctionSale({}, (error, result) => { Marketplace.subscribeEventCallback(error, result, eventName, _callBack); }); break;
            case "InitialAuctionFinished": Marketplace.Contract.events.InitialAuctionFinished({}, (error, result) => { Marketplace.subscribeEventCallback(error, result, eventName, _callBack); }); break;                
            case "TransferSingle": Collectibles.Contract.events.TransferSingle({}, (error, result) => { Marketplace.subscribeEventCallback(error, result, eventName, _callBack); }); break;                
            
            default: console.error(`Event "${eventName}" doesn't exist`); break;
        }

    },   
    
    /**
     * Function called once a contract event was subscribed
     * 
     * @param {string} error 
     * @param {any} result 
     * @param {string} eventName 
     * @param {function} _callBack 
     */
    subscribeEventCallback: (error, result, eventName, _callBack) => {
        let payload = null;
        if(!error && typeof _callBack !== 'undefined') {
            payload = createWeb3CallbackPayload('ok', result);            
        } else {
            let msg = `Failed to subscribe to ${eventName} event.`;
            console.error(msg);
            payload = createWeb3CallbackPayload('error', error, msg);            
        }        

        Web3Wrapper.SubscribedEventLog.push({
            Timestamp: new Date(),
            EventName: eventName,
            Data: payload
        });

        _callBack(payload);
            
    },

    /**
     * Cancel a specific emogram sale
     * Note: only the owner is allowed to cancel it in the contract
     * 
     * @param {number} emogramId 
     * @param {function} _callBack 
     */
    cancelSale: (emogramId, _callBack) => {         
        try {
            Marketplace.Contract.methods.cancelSell(emogramId).estimateGas({from: Web3Wrapper.SelectedAddress})
                .then((_) => { 
                    Marketplace.Contract.methods.cancelSell(emogramId).send({from: Web3Wrapper.SelectedAddress})
                        .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                        .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to cancel sale.')); });
                })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error)); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to cancel sale.'));
        }            
    },

    /**
     * Get onSale state of specific emogram
     * 
     * @param {number} emogramId 
     * @param {function} _callBack 
     */
    getOnSale: (emogramId, _callBack) => {
        try {
            Marketplace.Contract.methods.activeEmograms(Collectibles.Address, emogramId).call({from: Web3Wrapper.SelectedAddress})
            .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
            .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get active sales.')); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get active sales.'));
        }      
        
    },

    /**
     * Put a specific emogram up for sale
     * 
     * @param {number} emogramId 
     * @param {number} askingPrice 
     * @param {function} _callBack 
     */ 
    sellEmogram: (emogramId, askingPrice, _callBack) => {
        try {
            Marketplace.Contract.methods.addEmogramToMarket(emogramId, Collectibles.Address, Utils.EthToWei(askingPrice)).estimateGas({from: Web3Wrapper.SelectedAddress})
                .then((_) => { 
                    Marketplace.Contract.methods.addEmogramToMarket(emogramId, Collectibles.Address, Utils.EthToWei(askingPrice)).send({from: Web3Wrapper.SelectedAddress})
                    .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                    .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to put emogram up for sale.')); });
                })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error)); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to put emogram up for sale.'));
        }
        
    },

    /**
     * Buy emogram that is currently on sale
     * 
     * @param {number} saleId 
     * @param {number} amount 
     * @param {function} _callBack 
     */   
    buyEmogram: (saleId, amount, _callBack) => {
        try {
            Marketplace.Contract.methods.buyEmogram(saleId).estimateGas({from: Web3Wrapper.SelectedAddress, value: Utils.EthToWei(amount)})
                .then((_) => { 
                    Marketplace.Contract.methods.buyEmogram(saleId).send({from: Web3Wrapper.SelectedAddress, value: Utils.EthToWei(amount)})
                    .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                    .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to buy emogram.')); });
                })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error)); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to buy emogram.'));
        }
    },

    /**
     * Get sale details of specific emogram
     * 
     * index is the index of the emogram in the contract
     * 
     * @param {number} emogramId 
     * @param {function} _callBack 
     * @param {number} index 
     */
    getSaleDetails: (emogramId, _callBack, index = 0) => {            
            try {
                Marketplace.Contract.methods.emogramsOnSale(index).call({from: Web3Wrapper.SelectedAddress})
                .then((result) => {                    
                    if(result.tokenId == emogramId && !result.isSold){
                        if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result));
                    } else {   
                        Marketplace.getSaleDetails(emogramId, _callBack, index+1);
                    }
                })
                .catch(( error ) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get sale details.')); });
            } catch (error) {                
                if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get sale details.'));
            }
    },

    /**
     * Get onAuction state of specific emogram
     * 
     * @param {number} emogramId 
     * @param {function} _callBack 
     */
    getOnAuction: (emogramId, _callBack) => {    
        try {    
            Marketplace.Contract.methods.activeAuctions(Collectibles.Address, emogramId).call()
            .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
            .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get active auctions.')); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to get active auctions.'));
        }   
    },    

    /**
     * Create a new auction for @param emogramId, for a duration of @param duration days, with a starting price of @param startPrice
     * 
     * @param {number} emogramId 
     * @param {number} duration number of days
     * @param {number} startPrice 
     * @param {function} _callBack 
     */  
    auctionEmogram: (emogramId, duration, startPrice, _callBack) => {
        try {
            Marketplace.Contract.methods.createAuction(emogramId, Collectibles.Address, duration, Utils.EthToWei(startPrice)).estimateGas({from: Web3Wrapper.SelectedAddress})
                .then((_) => { 
                    Marketplace.Contract.methods.createAuction(emogramId, Collectibles.Address, duration, Utils.EthToWei(startPrice)).send({from: Web3Wrapper.SelectedAddress})
                    .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                    .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to create auction.')); });
                })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error)); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to create auction.'));
        }          
    },
    
    /**
     * Cancel active auction using auctionId and emogramId
     *  
     * @param {number} auctionId 
     * @param {number} emogramId 
     * @param {function} _callBack 
     */ 
    cancelAuction: (auctionId, emogramId, _callBack) => {
        try {
            Marketplace.Contract.methods.cancelAuction(auctionId, emogramId, Collectibles.Address).estimateGas({from: Web3Wrapper.SelectedAddress})
            .then((_) => { 
                Marketplace.Contract.methods.cancelAuction(auctionId, emogramId, Collectibles.Address).send({from: Web3Wrapper.SelectedAddress})
                    .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                    .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to cancel auction.'));});
             })
            .catch((error) => { _callBack(createWeb3CallbackPayload('error', error));});
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to cancel auction.'));
        }  
    },
    
    /**
     * Place a bid on an active auction
     * 
     * @param {number} auctionId 
     * @param {number} emogramId 
     * @param {number} amount 
     * @param {function} _callBack 
     */
    placeBid: (auctionId, emogramId, amount, _callBack) => {
        try {
            Marketplace.Contract.methods.PlaceBid(auctionId, emogramId, Collectibles.Address).estimateGas({from: Web3Wrapper.SelectedAddress, value: Utils.EthToWei(amount)})
            .then((_) => { 
                Marketplace.Contract.methods.PlaceBid(auctionId, emogramId, Collectibles.Address).send({from: Web3Wrapper.SelectedAddress, value: Utils.EthToWei(amount)})
                        .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                        .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to place bid.')); });
            })
            .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error));});    
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to place bid.'));
        }
               
    },

    /**
     * Check if we are in the initial auction period
     * Some website functionality is limited in this period
     * 
     * @param {function} _callBack 
     */
    isInitialAuctionPeriod: (_callBack) => {
        try {
            Marketplace.Contract.methods.isInitialAuction().call()
                .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get initial auction state.')); });        
        } catch (error) {                
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get initial auction state.'));
        }   
        
    },
    
    /**
     * Finish an ended auction.
     * Finishing the auction transfers and token and the funds
     * 
     * @param {number} auctionId 
     * @param {number} emogramId 
     * @param {function} _callBack 
     */
    finishAuction: (auctionId, emogramId, _callBack) => {        
        try {
            Marketplace.Contract.methods.finishAuction(Collectibles.Address, emogramId, auctionId).estimateGas({from: Web3Wrapper.SelectedAddress})
                .then((_) => { 
                    Marketplace.Contract.methods.finishAuction(Collectibles.Address, emogramId, auctionId).send({from: Web3Wrapper.SelectedAddress})
                        .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                        .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to end auction.'));   });  
                })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error));}); 
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to end auction.'));
        }
    },

    /**
     * Get auction details of specific emogram
     * 
     * index is the index of the emogram in the contract
     * 
     * @param {number} emogramId 
     * @param {function} _callBack 
     * @param {number} index 
     */
    getAuctionDetails: (emogramId, _callBack, index = 0) => {            
        try {
            Marketplace.Contract.methods.emogramsOnAuction(index).call({from: Web3Wrapper.SelectedAddress})
            .then((result) => {                    
                if(result.tokenId == emogramId && result.onAuction){
                    if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result));
                } else {   
                    Marketplace.getAuctionDetails(emogramId, _callBack, index+1);
                }
            })
            .catch(( error ) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to end auction.')); });
        } catch (error) {                
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Error while getting auction details.'));
        }
    },    

    /**
     * Get past @param eventName events for the emogram with ID @param emogramId
     * 
     * @param {number} emogramId 
     * @param {string} eventName 
     * @param {function} _callBack 
     */
    getPastEvents: (emogramId, eventName, _callBack) => {
        try {
            Marketplace.Contract.getPastEvents(eventName, { 
                filter: {tokenId: emogramId},
                fromBlock: 0,
                toBlock: 'latest'
            })
                .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result )); })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get past events.')); });
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get past events.'));
        }
    },

    /**
     * Transfer ownership of specific token to the recipient
     * 
     * @param {string} to recipient address
     * @param {number} emogramId 
     * @param {function} _callBack 
     */
    transferSingle: (to, emogramId, _callBack) => {       
        try {
            Collectibles.Contract.methods.safeTransferFrom(Web3Wrapper.SelectedAddress, to, emogramId, 1, '0x').estimateGas({from: Web3Wrapper.SelectedAddress})
                .then((_) => { 
                    Collectibles.Contract.methods.safeTransferFrom(Web3Wrapper.SelectedAddress, to, emogramId, 1, '0x').send({from: Web3Wrapper.SelectedAddress})
                        .then((result) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok', result)); })
                        .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to transfer emogram.'));   });  
                })
                .catch((error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error));});           
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Failed to transfer emogram.'));
        }
    },

    /**
     * Get list of ids of currently active Initial Auctions
     * 
     * @param {function} _callBack 
     */
    getInitialAuctionTokenIds: (_callBack) => {
        try {
            let initialAuctions = [];

            Collectibles.EMOGRAM_ID.forEach( tokenId => 
                Marketplace.Contract.methods.activeAuctions(Marketplace.Address, tokenId).call()
                .then( (_) => { initialAuctions.push(tokenId); })
                .catch( ( error) => { if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, `Could not get auction statis for tokenId ${tokenId}`)); })
            );

            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('ok')); //TODO: check type of 2nd argument
        } catch (error) {
            if( typeof _callBack !== undefined ) _callBack(createWeb3CallbackPayload('error', error, 'Could not get active auctions.'));
        }
    }

};

/**
 * Miscellaneous utility functions
 * 
 * e.g:
 * Eth/Wei conversions, price rounding
 */
let Utils = {

    EthToWei: (n) => {    
        if(typeof n !== 'undefined') {       
            let dec_count = Utils.countDecimals(n);        
            let int = n.replace('.', '');
            let str = int.toString();
            for(var i = 0; i < 17 - dec_count; i++){
                str = str + "0";
            }
            str = str + '1';

            return str;
        } else {
            return '';
        }

    },
    
    WeiToEth: (n) => {   
        if(typeof n !== 'undefined') {            
            var eth = Web3Wrapper.Provider.utils.fromWei(n.toString(),'ether');            
            var ethRounded = Math.round((parseFloat(eth) + Number.EPSILON) * 1000) / 1000;         
            return ethRounded.toString();
        } else {
            return '';
        }

    },

    countDecimals: (value) => {
        if(Math.floor(value) === value) return 0;
        try {
        return value.toString().split(".")[1].length;
        } catch {
            return 0;
        }
    },

    //2.0
    getCorrectedPrice: (value) => {        
        let valueStr = value.toString();        
        let step = valueStr.length > 18 ? parseInt(valueStr.substring(0, valueStr.length - 2)) : 1e16;
        let valueStep = parseInt(value) + step;
        return valueStep;
    },

    getTimeLeft: (endDate) => {
        if(typeof endDate !== 'undefined' && endDate !== null) {
            const timeNow = new Date();

            const diffMS = endDate - timeNow;

            const h = diffMS > 0 ? Math.floor(diffMS / 36e5) : 0;
            const m = diffMS > 0 ? Math.floor((diffMS - (h * 36e5)) / 6e4) : 0; 

            return `${h}H ${m}MIN`;       
        }
    }


}

/**
 * Functions related to IPFS 
 */
let IPFS = {
    /**
     * Return the contructed image url
     * 
     * @param {string} name 
     * @param {function} _callBack 
     */
    getImageUri: (name, _callBack) => {
        let uri = `${IPFSHost}${IPFSEmogramsDir}${name}.png`;
        if(typeof _callBack == 'undefined') {
            return uri;
        } else {
            _callBack(uri);
        }
    }

}

/**
 * List used to temporarily hold emogram data while waiting for all of it
 */
let _TMP = {};

/**
 * Create array of EmogramHistoryEvent from array received from contracts
 * 
 * @param {array} array 
 * @returns array of EmogramHistoryEvent
 */
function toEmogramHistoryEvent(array){
    let returnArray = [];

    array.forEach(x => {        
        let ehe = new EmogramHistoryEvent(
            x.event, 
            typeof x.returnValues.askingPrice !== 'undefined' ? x.returnValues.askingPrice : typeof x.returnValues.bid !== 'undefined' ? x.returnValues.bid : typeof x.returnValues.highestBid !== 'undefined' ? x.returnValues.highestBid : typeof x.returnValues.startPrice !== 'undefined' ? x.returnValues.startPrice : '',
            typeof x.returnValues.seller !== 'undefined' ? x.returnValues.seller : typeof x.returnValues.bidder !== 'undefined' ? x.returnValues.bidder : typeof x.returnValues.highestBidder !== 'undefined' ? x.returnValues.highestBidder : typeof x.returnValues.from !== 'undefined' ? x.returnValues.from : '',
            typeof x.returnValues.buyer  !== 'undefined' ? x.returnValues.buyer : typeof x.returnValues.to !== 'undefined' ? x.returnValues.to : '',
            x.transactionHash,
            x.blockNumber  
        );
        returnArray.push(ehe);          
        
    });
    
    return returnArray;    
}

/**
 * Get emogram data from the contracts
 * Calls multiple functions, fills _TMP with received data while waiting for all functions to return
 * 
 * @param {integer} tokenId 
 * @param {function} _callBack 
 */
function getEmogramData(tokenId, _callBack) {
    _TMP[tokenId] = {};        
        
    // owner          
    Collectibles.ownerOfById(tokenId, (result) => { if(result.Status !== 'error') { _TMP[tokenId]['owner'] = result.Result; tryPushEmogramToList(tokenId, _callBack); }})

    // isOnSale, saleData
    _TMP[tokenId]['saleData'] = [];
    if(typeof Collectibles.SaleArray === 'undefined') { Collectibles.getSaleArray((array) => { if(array.Status !== 'error') { Collectibles.SaleArray = createSaleArray(array.Result); getSaleDetails(tokenId, _callBack);} })} 
    else { getSaleDetails(tokenId, _callBack); }

    // isOnAuction, auctionData 
    _TMP[tokenId]['auctionData'] = [];
    if(typeof Collectibles.AuctionArray === 'undefined') { Collectibles.getAuctionArray((array) => { if(array.Status !== 'error') { Collectibles.AuctionArray = createAuctionArray(array.Result); getAuctionDetails(tokenId, _callBack);} })}
    else { getAuctionDetails(tokenId, _callBack); }

    //history (AuctionCreated)
    Marketplace.getPastEvents(tokenId, 'AuctionCreated', (result) => { if(result.Status !== 'error') { _TMP[tokenId]['history'] = toEmogramHistoryEvent(result.Result); tryPushEmogramToList(tokenId, _callBack); }});

    // imageUri, name
    Collectibles.getUri(tokenId, (result) => { 
        if(result.Status === 'error' || (typeof result.Result.image === 'undefined' || typeof result.Result.name === 'undefined')) { 

            _TMP[tokenId]['imageUri'] = '';
            _TMP[tokenId]['name'] = '';
        } else {
            
            _TMP[tokenId]['imageUri'] = typeof result.Result.image !== 'undefined' ? result.Result.image : '';
            _TMP[tokenId]['name'] = typeof result.Result.name !== 'undefined' ? result.Result.name : '';
        }        

        tryPushEmogramToList(tokenId, _callBack);
    });
}


/**
 * Create array of AuctionArrayItem from array received from contract
 * 
 * @param {array} array 
 * @returns array of AuctionArrayItem
 */
function createAuctionArray(array){
    let cArray = [];
    array.forEach( x => { 
        let item = new AuctionArrayItem(x);
        if(!item.IsNulled()) {            
            cArray.push(item);
        }
    });
    return cArray;
}

/**
 * Create array of SaleArrayItem from array received from contract
 * 
 * @param {array} array 
 * @returns array of SaleArrayItem
 */
function createSaleArray(array){
    let cArray = [];
    array.forEach( x => { 
        let item = new SaleArrayItem(x);
        if(!item.IsNulled()) {            
            cArray.push(item);
        }
    });
    return cArray;
}

/**
 * Create Emogram object from _TMP and call the callBack function with it
 * 
 * @param {integer} tokenId 
 * @param {function} _callBack 
 */
function tryPushEmogramToList(tokenId, _callBack) {

    if (
        typeof _TMP[tokenId]['owner'] !== 'undefined' &&
        typeof _TMP[tokenId]['isOnSale'] !== 'undefined' &&
        typeof _TMP[tokenId]['isOnAuction'] !== 'undefined' &&
        typeof _TMP[tokenId]['auctionDataDone'] !== 'undefined' && _TMP[tokenId]['auctionDataDone'] &&
        typeof _TMP[tokenId]['saleDataDone'] !== 'undefined' && _TMP[tokenId]['saleDataDone'] &&
        typeof _TMP[tokenId]['name'] !== 'undefined' &&
        typeof _TMP[tokenId]['imageUri'] !== 'undefined' && 
        typeof _TMP[tokenId]['history'] !== 'undefined'
    ) {     
        let em = new Emogram(tokenId, _TMP[tokenId]['name'], _TMP[tokenId]['owner'], _TMP[tokenId]['isOnSale'], _TMP[tokenId]['isOnAuction'], _TMP[tokenId]['auctionData'], _TMP[tokenId]['saleData'],  _TMP[tokenId]['imageUri'],  _TMP[tokenId]['history']);
        _callBack(em);
    }
}

/**
 * Sent current Owner in _TMP from past events:
 * emogramSold, auctionFinished, transferSingle, initialAuctionSale
 * 
 * @param {integer} tokenId 
 */
function setTMPOwner(tokenId) {    
    if(
        typeof _TMP[tokenId]['emogramSold'] !== 'undefined' && 
        typeof _TMP[tokenId]['auctionFinished'] !== 'undefined' && 
        typeof _TMP[tokenId]['transferSingle'] !== 'undefined' &&
        typeof _TMP[tokenId]['initialAuctionSale'] !== 'undefined'  
        
    ){  
        let combined = _TMP[tokenId]['emogramSold'].concat(_TMP[tokenId]['auctionFinished']).concat(_TMP[tokenId]['initialAuctionSale']).concat(_TMP[tokenId]['transferSingle']);
        
        combined.sort( (a, b) => {
            return b.blockNumber - a.blockNumber;
        });        
    
        if(combined.length > 0) {
            _TMP[tokenId]['owner'] = typeof combined[0].returnValues.buyer !== 'undefined' ? combined[0].returnValues.buyer : typeof combined[0].returnValues.highestBidder !== 'undefined' ?  combined[0].returnValues.highestBidder : combined[0].returnValues.to;            
        } else {            
            _TMP[tokenId]['owner'] = '';
        }

    }
}

/**
 * Get Sale data for a specific token and call the callBack function with the result
 * 
 * @param {integer} tokenId 
 * @param {Function} _callBack 
 */
function getSaleDetails(tokenId, _callBack) { 
    let currentSaleData = [];
    if(typeof Collectibles.SaleArray !== 'undefined') {
        let index = Collectibles.SaleArray.findIndex(x => x.TokenId == tokenId + '' && x.IsOnSale); 
        currentSaleData = index !== -1 ? Collectibles.SaleArray[index] : [];
    }

    if(currentSaleData.length == 0) {
        _TMP[tokenId]['isOnSale'] = false;
    } else {
        _TMP[tokenId]['isOnSale'] = true;
        _TMP[tokenId]['saleData'] = new EmogramSale(currentSaleData.SaleId, currentSaleData.AskingPrice);    
    }

    _TMP[tokenId]['saleDataDone'] = true;       
    tryPushEmogramToList(tokenId, _callBack);
}

/**
 * Create and return a Web3CallBackPayload object
 * 
 * @param {string} status 
 * @param {string} result 
 * @param {string} customMessage 
 * @returns Web3CallBackPayload object
 */
function createWeb3CallbackPayload(status, result, customMessage) {    
    let message = '';

    if(typeof customMessage !== 'undefined'){
        message = customMessage;
    } else {
        if(status === 'error') {
            if(typeof result !== undefined) {
                if(result.message.includes('err: insufficient funds for gas * price + value')) {
                    message = 'Insufficient funds in wallet.';
                } else {                
                    let arr = result.toString().split('\n');
                    let errorObj = JSON.parse(arr.slice(arr.indexOf("{"), arr.lastIndexOf("}")+1).join(""));
                    message = errorObj.originalError.message.replace('execution reverted: ', '');
                    message = message.replace('.', '').replace('!', '')+'.';
                }
            }
        }
    }
    
    return new Web3CallBackPayload(status, result, message);
}

/**
 * Get Auction data for a specific token and call the callBack function with the result
 * 
 * @param {integer} tokenId 
 * @param {Function} _callBack 
 */
function getAuctionDetails(tokenId, _callBack) { 
    let currentAuctionData = [];
    let hadPreviousAuction = false;
    if(typeof Collectibles.AuctionArray !== 'undefined') {
        let index = Collectibles.AuctionArray.findIndex(x => x.TokenId == tokenId + '' && x.OnAuction);
        currentAuctionData = index !== -1 ? Collectibles.AuctionArray[index] : [];         
        hadPreviousAuction = Collectibles.Emograms.filter( 
            x => { 
                return x.Id == tokenId && 
                x.History.findIndex((y) => { y.OriginalEvent == 'AuctionCreated'}) !== -1
            });  
    }

    _TMP[tokenId]['hadPreviousAuction'] = hadPreviousAuction;

    if(currentAuctionData.length == 0) {
        _TMP[tokenId]['isOnAuction'] = false;
    } else {
        _TMP[tokenId]['isOnAuction'] = true;
        _TMP[tokenId]['auctionData'] = new EmogramAuction(currentAuctionData.AuctionId, currentAuctionData.StartPrice, undefined, currentAuctionData.HighestBidder, currentAuctionData.HighestBid, currentAuctionData.EndDate);      
    }


    _TMP[tokenId]['auctionDataDone'] = true;       
    tryPushEmogramToList(tokenId, _callBack);
}

/**
 * Create an array filled with a value
 * 
 * @param {any} value 
 * @param {integer} len 
 * @returns an array of @param len length filled with @param value
 */
function toArrayWithLength(value, len){
    if (len == 0) return [];
    var a = [value];
    while (a.length * 2 <= len) a = a.concat(a);
    if (a.length < len) a = a.concat(a.slice(0, len - a.length));
    return a;
}

/**
 * Update "Connect web3" button text and OnClick event
 */
function updateConnectButton(){
    Collectibles.getAccountSRTCount(_updateConnectButtonCallback);
    Collectibles.getAccountEmogramCount(_updateConnectButtonCallback);

    $(".connect-btn").off('click');
    $(".connect-btn").on('click', () => {
        Web3Wrapper.LibraryFilter = 'own';        
        window.location.href = 'library';
    });
}

function _updateConnectButtonCallback(){
    if(Collectibles.SRTCount !== null && Collectibles.EmogramCount !== null){
        $(document).find('.connect-btn').html(`NFT: ${Collectibles.EmogramCount} | SRT: ${Collectibles.SRTCount}`);
    }
}

/**
 * Send AJAX request and set Marketplace.ABI if it is not set
 */
function setMarketplaceABI(){
    if(typeof sessionStorage.MarketplaceAbi !== 'undefined') {
        Marketplace.ABI = JSON.parse(sessionStorage.MarketplaceAbi);  
        setCollectibleABI();
    } else {
        $.getJSON( `./assets/php/get-abi.php?address=${Marketplace.Address}`, {})
            .done((data) => {             
                if (data.message == 'OK' ) {
                    Marketplace.ABI = JSON.parse(data.result); 
                    sessionStorage.MarketplaceAbi = data.result;
                    setCollectibleABI();
                } else {
                    console.error(data);                    
                }
            });    
    }
}

/**
 * Send AJAX request and set Collectibles.ABI if it is not set
 */
function setCollectibleABI(){
    if(typeof sessionStorage.CollectiblesAbi !== 'undefined') {
        Collectibles.ABI = JSON.parse(sessionStorage.CollectiblesAbi);  
        Web3Wrapper.initializeContracts(); 
    } else {

        $.getJSON( `./assets/php/get-abi.php?address=${Collectibles.Address}` , {})
            .done((data) => { 
                if (  data.message == 'OK' ) {
                    Collectibles.ABI = JSON.parse(data.result);  
                    sessionStorage.CollectiblesAbi = data.result;
                    Web3Wrapper.initializeContracts(); 
                } else {
                    console.error(data);
                }
            }).catch((error) => {console.error(error)})
            ; 
    }   
}

/**
 * Starts the process of setting up the Contract objects
 */
function setupContracts(){  

    
    setMarketplaceABI();

    try {
        //initialize the SelectedAddress
        Web3Wrapper.SelectedAddress;
    } catch (e) {
        console.error(e);
    }

}

/**
 * Create link from transaction hash.
 * Only the first 8 characters of the hash is shown
 * 
 * @param {string} hash 
 * @returns {string} HTML
 */
function createEtherscanLink(hash){ 
    return hash == null ? '' : `<a target="_blank" href="https://etherscan.io/search?f=0&q=${hash}">${hash.slice(0,8)}</a>`;
}

/**
 * Sort children inside parent
 * 
 * @param {string} parentSelector 
 * @param {string} childSelector 
 * @param {string} attribute 
 * @param {bool} sortAscending 
 * @param {bool} isNumber 
 */
function sortChildren(parentSelector, childSelector, attribute, sortAscending = true, isNumber = false){
    var gridItems = $(parentSelector).children(childSelector);

    gridItems.sort(function(a, b) {
        var vA = isNumber ? parseInt($(a).attr(attribute)) : $(a).attr(attribute);
        var vB = isNumber ? parseInt($(b).attr(attribute)) : $(b).attr(attribute);        
        if(sortAscending) { return (vA < vB) ? -1 : (vA > vB) ? 1 : 0; }
        else { return (vA > vB) ? -1 : (vA < vB) ? 1 : 0; }        
    });

    $(parentSelector).append(gridItems);
}

/**
 * Makes an AJAX call to ./assets/php/gateways.php to get .env data
 * @param {function} _callBack 
 */
function getEnvData(_callBack) {
    $.getJSON( './assets/php/gateways.php' , {})
    .done((data) => {
        WEB3_GATEWAY = data.WEB3_GATEWAY;
        Collectibles.Address = data.WEB3_COLLECTIBLES_ADDRESS;
        Marketplace.Address = data.WEB3_MARKETPLACE_ADDRESS;
        Marketplace.ProxyAddress = data.WEB3_MARKETPLACE_PROXY_ADDRESS;
        IPFS_GATEWAY = data.IPFS_GATEWAY;
        CACHE_ENABLED = data.CACHE_ENABLED.toLowerCase() === 'true';

        _callBack();
    });
}

$(() => {

    $(".connect-btn").off('click');
    $(".connect-btn").on('click', () => {
            Web3Wrapper.connectWeb3(true);
    });

    $(document).bind('contractsCreated', async () => {       
        Web3Wrapper.subscribeContractEvents();

        Web3Wrapper.IsAutologinEnabled = document.cookie.includes('egram_accountConnected');
        if(Web3Wrapper.IsAutologinEnabled) {
            Web3Wrapper.loadRequiredInfo(() => {
                Web3Wrapper.connectWeb3();
            });
        } else {
            Web3Wrapper.loadRequiredInfo();
        }
        
        if(typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', (accounts) =>  {
                if(Web3Wrapper.IsFunctionalityLimited !== true) {                   
                    updateConnectButton();
                } 
            });

            window.ethereum.on('chainChanged', () => {
                sessionStorage.clear();
            });

            
        }   
        
    });


    getEnvData( () => {
        Web3Wrapper.getIsMetamaskInstalled((isMetamaskInstalled) => {             
            Web3Wrapper.IsMetamaskInstalled = isMetamaskInstalled;
            setupContracts();
        });
    });
    
    
});

/**
 * Emogram class
 * Id, Name, Owner, IsOnSale, IsOnAuction, AuctionData, SaleData, ImageUri, History, HadPreviousAuction
 */
class Emogram {
    constructor(id, name, owner, isOnSale, isOnAuction, auctionData, saleData, imageUri, history) {
        if(typeof id !== 'undefined' && id !== null) {
            this.Id = id;
            this.Name = name;       
            this.Owner = owner.toLowerCase().replace('0x0000000000000000000000000000000000000000', ''); 
            this.IsOnSale = isOnSale;
            this.IsOnAuction = isOnAuction;
            this.AuctionData = auctionData;
            this.SaleData = saleData;            
            this.ImageUri = imageUri;
            this.History = history;
            this.HadPreviousAuction = history.length > 0;
        } else {
            throw 'Emogram ID is undefined or null';
        }   
    }
}

/**
 * Which emogram detail was changed
 * Owner, OnSale, OnAuction, AuctionData, SaleData
 */
class EmogramChanged {
    constructor(id, ownerChanged = false, onSaleChanged = false, onAuctionChanged = false, auctionDataChanged = false, saleDataChanged = false, historyChanged = false) {
        if(typeof id !== 'undefined' && id !== null) {
            this.EmogramId =  id;
            this.OwnerChanged = ownerChanged;
            this.OnSaleChanged = onSaleChanged;
            this.OnAuctionChanged = onAuctionChanged;
            this.AuctionDataChanged = auctionDataChanged;
            this.SaleDataChanged = saleDataChanged;            
        } else {
            throw 'Emogram ID is undefined or null';
        }        
    }
}

/**
 * hold basic auction details
 */
class EmogramAuction {
    constructor(auctionId, startPrice, duration, highestBidder, highestBid, endTimestamp) {
        this.AuctionId = auctionId;
        this.StartPrice = startPrice;
        this.Duration = duration;
        this.HighestBidder = highestBidder;
        this.HighestBid = highestBid;
        this.EndTimestamp = endTimestamp;
    }
}

/**
 * hold basic sale details
 */
class EmogramSale {
    constructor(saleId, price) {
        this.SaleId = saleId;
        this.Price = price;
    }   
}

/**
 * mapping to nicer event names
 */
const eventNameMapping = {
    'EmogramAdded': "SALE STARTED",
    'SellCancelled': "SALE CANCELLED",
    'EmogramSold': "SOLD",
    'BidPlaced': "BID",    
    'AuctionCreated': "AUCTION CREATED",
    'AuctionCanceled': "AUCTION CANCELLED",
    'AuctionFinished': "AUCTION FINISHED",
    'InitialAuctionSale': "INITIAL SALE",
    'InitialAuctionFinished': "INITIAL AUCTION ENDED",
    'TransferSingle': "TRANSFER"
}

/**
 * emogram history class used for past events
 * used on emogram page
 */
class EmogramHistoryEvent {
    constructor(event, amount, from, to, transaction, blockNumber) {
        this.OriginalEvent = event;
        this.BlockNumber = blockNumber;
        this.Event = eventNameMapping[event];
        this.Amount = amount;
        this.From = from;
        this.To = to;
        this.Transaction = transaction;
    }
}

/**
 * class for holding sale info
 * used with array requested from marketplace contract
 */
class SaleArrayItem {
    constructor(array, isCache) {
        if(typeof array.sellId !== 'undefined') {
            this.SaleId = array.sellId;
            this.IsOnSale = typeof isCache !== 'undefined' ? array.isSold : !array.isSold;            
            this.AskingPrice = array.price;
            this.TokenAddress = array.tokenAddress;
            this.TokenId = array.tokenId;   
            this.Seller = array.seller;         
        } else {            
            this.SaleId = array[0];
            this.IsOnSale = !array[5];            
            this.AskingPrice = array[4];
            this.TokenAddress = array[1];
            this.TokenId = array[2]; 
            this.Seller = array[3];
        }
    }

    /** 
     * Returns true if the array item is filled with 0 values
     * 
     * Solidity doesn't remove values from arrays, an item filled with zeros is treadted as null
     * 
     * @returns {bool}
     */
    IsNulled () {
        let val = 
            this.SaleId === '0' &&
            this.IsOnSale === true &&   //need to check for true here becuase we negate it in the constructor         
            this.AskingPrice === '0' &&
            this.TokenAddress === '0x0000000000000000000000000000000000000000' &&
            this.TokenId === '0' &&
            this.Seller === '0x0000000000000000000000000000000000000000'
        ;
        return val;            
    }
}

/**
 * class for holding auction info
 * used with array requested from marketplace contract
 */
class AuctionArrayItem {
    constructor(array) {
        
        if(typeof array.auctionId !== 'undefined') {
            this.AuctionId = array.auctionId;
            this.EndDate = array.endDate;
            this.OnAuction = array.onAuction;
            this.Seller = array.seller;
            this.StartPrice = array.startPrice;
            this.TokenAddress = array.tokenAddress;
            this.TokenId = array.tokenId;
            this.HighestBid = array.highestBid;
            this.HighestBidder = array.highestBidder;
        } else {
            this.AuctionId = array[0];
            this.EndDate = array[7];
            this.OnAuction = array[8];
            this.Seller = array[3];
            this.StartPrice = array[5];
            this.TokenAddress = array[1];
            this.TokenId = array[2];
            this.HighestBid = array[6];
            this.HighestBidder = array[4];
        }        
    }

    IsNulled () {
        let val = 
            this.AuctionId === '0' &&
            this.EndDate === '0' &&
            this.OnAuction === false &&
            this.Seller === '0x0000000000000000000000000000000000000000' &&
            this.StartPrice === '0' &&
            this.TokenAddress === '0x0000000000000000000000000000000000000000' &&
            this.TokenId === '0' &&
            this.HighestBid === '0' &&
            this.HighestBidder === '0x0000000000000000000000000000000000000000' 
        ;
        return val;            
    }
}

/**
 * class used as return value from web3 calls
 */
class Web3CallBackPayload {
    constructor(status, result, customMessage) {
        this.Status = status;
        this.Result = result;
        this.CustomMessage = customMessage;
    }
}