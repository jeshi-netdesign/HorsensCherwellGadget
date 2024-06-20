var debug = true;
var debugLevel = 1;
var versionG = 'v-0.01';
var agentId;
let lastCallId;

var finesse = finesse || {};
finesse.gadget = finesse.gadget || {};
finesse.container = finesse.container || {};
clientLogs = finesse.cslogger.ClientLogger || {};

finesse.gadget.Config = (function () {
	var _prefs = new gadgets.Prefs();
	return {
		authorization: _prefs.getString('authorization'),
		country: _prefs.getString('country'),
		language: _prefs.getString('language'),
		locale: _prefs.getString('locale'),
		host: _prefs.getString('host'),
		hostPort: _prefs.getString('hostPort'),
		extension: _prefs.getString('extension'),
		mobileAgentMode: _prefs.getString('mobileAgentMode'),
		mobileAgentDialNumber: _prefs.getString('mobileAgentDialNumber'),
		xmppDomain: _prefs.getString('xmppDomain'),
		pubsubDomain: _prefs.getString('pubsubDomain'),
		restHost: _prefs.getString('restHost'),
		scheme: _prefs.getString('scheme'),
		localhostFQDN: _prefs.getString('localhostFQDN'),
		localhostPort: _prefs.getString('localhostPort'),
		clientDriftInMillis: _prefs.getInt('clientDriftInMillis'),
	};
})();

finesse.modules = finesse.modules || {};
finesse.modules.Cherwell = (function ($) {
	var user, states, dialogs, currdialog, dialog, usrs, agentName, newState, oldState;
	var _lastProcessedTimerTick = null;
	var _maxTimerCallbackThreshold = 2000;
	var _forceTickProcessingEvery = 4000;
	function render() {
		// console.log('(callCherwellPage) Render - IN');
		// clientLogs.log('In render - Cherwell');
		// console.log('(callCherwellPage) Render - OUT');
	}

	function displayCall(dialog) {
		// console.debug('displayCall - IN');
		// console.debug('displayCall -dialog: ', dialog);

		var callvars = dialog.getMediaProperties();
		var callType = dialog.getCallType();
		var callState = dialog.getState();

		console.debug('displayCall -dialog: ', dialog);
		console.debug('displayCall -CallType: ', callType);
		console.debug('displayCall -callState: ', callState);
		console.debug('displayCall -callVars: ', callvars);
		if (callType === 'ACD_IN' && callState == 'ACTIVE') {
			if (lastCallId != callvars['callVariable1']) {
				console.debug('active', callvars['callVariable1'], dialog.getFromAddress());
				lastCallId = callvars['callVariable1'];
				fetch(`http://localhost:8080/api/${dialog.getFromAddress()}`, {
					mode: 'no-cors',
				})
					.then(() => {
						console.debug('success');
					})
					.catch((e) => {
						console.error(e);
					});
			}
		}

		// console.debug('displayCall - OUT');
	}
	function userDialog(dialogs) {
		// console.debug('userDialog - IN', 1);

		var dialogCollection = dialogs.getCollection();
		for (var dialogId in dialogCollection) {
			_dialog = dialogCollection[dialogId];
			// console.debug('userDialog ' + dialogId + ': ' + _dialog);
		}

		// console.debug('userDialog - OUT', 1);
	}
	function handleNewDialog(dialog) {
		_processCallChange(dialog);
		dialog.addHandler('change', _processCallChange);
	}
	function handleEndDialog(dialog) {}

	function handleUserLoad(userevent) {
		// console.debug('(callCherwellPage) handleUserLoad - IN', 1);
		gadgets.window.adjustHeight();
		dialogs = user.getDialogs({
			onCollectionAdd: handleNewDialog,
			onCollectionDelete: handleEndDialog,
			onLoad: userDialog,
		});
		render();
		agentId = user.getId();
		// console.debug('(callCherwellPage) handleUserLoad - OUT', 1);
	}

	function handleUserChange(userevent) {
		render();
	}
	function _processCallChange(dialog) {
		displayCall(dialog);
	}

	function _timerTickHandler(timerTickEvent) {}

	/** @scope finesse.modules.Cherwell */
	return {
		init: function () {
			var prefs = new gadgets.Prefs(),
				id = prefs.getString('id');
			var clientLogs = finesse.cslogger.ClientLogger;
			finesse.clientservices.ClientServices.init(finesse.gadget.Config);
			gadgets.window.adjustHeight('50');
			// console.log('we have sized gadget');
			clientLogs.init(gadgets.Hub, 'Cherwell');
			user = new finesse.restservices.User({
				id: id,
				onLoad: handleUserLoad,
				onChange: handleUserChange,
			});
			states = finesse.restservices.User.States;
			containerServices = finesse.containerservices.ContainerServices.init();
			containerServices.addHandler(
				finesse.containerservices.ContainerServices.Topics.ACTIVE_TAB,
				() => clientLogs.log('Gadget is now visible')
			);
			containerServices.makeActiveTabReq();
			containerServices.addHandler(
				finesse.containerservices.ContainerServices.Topics.TIMER_TICK_EVENT,
				_timerTickHandler
			);
		},
	};
})(jQuery);
