'use strict';

const path = require('path');

const { GUI, TABS } = require('./../js/gui');
const i18n = require('./../js/localization');

require('./osd');
require('./sensors');

TABS.telemetry = {};

TABS.telemetry.activeChildTab = null;
TABS.telemetry.childLoading = false;
TABS.telemetry.loadToken = 0;

const CHILD_CONTAINER = '#telemetry-child-container';

const CHILD_TABS = {
    osd: {
        tabName: 'osd',
        subtabId: 'subtab-telemetry-osd',
    },
    sensors: {
        tabName: 'sensors',
        subtabId: 'subtab-telemetry-sensors',
    },
};

function setChildLoading(isLoading) {
    TABS.telemetry.childLoading = isLoading;

    const $root = $('.tab-telemetry');

    $root.find('.subtab__header_label')
        .toggleClass('disabled', isLoading);

    if (isLoading) {
        if (!$root.find('.telemetry-child-loader').length) {
            $root.find('#telemetry-wrapper')
                .append('<div class="telemetry-child-loader"><div class="data-loading"></div></div>');
        }

        return;
    }

    $root.find('.telemetry-child-loader').remove();
}

function setVisibleSubtab(childTabName) {
    const $root = $('.tab-telemetry');
    const childTab = CHILD_TABS[childTabName];

    if (!childTab) {
        return;
    }

    $root.find('.subtab__header_label').removeClass('subtab__header_label--current');

    $root.find('.subtab__header_label[data-telemetry-tab="' + childTabName + '"]')
        .addClass('subtab__header_label--current');

    $root.find('.subtab__content').removeClass('subtab__content--current');

    $root.find('#' + childTab.subtabId)
        .addClass('subtab__content--current');

    $root.find('#' + childTab.subtabId).append($(CHILD_CONTAINER));
}

function cleanupChildTab(callback) {
    const activeChildTab = TABS.telemetry.activeChildTab;

    if (!activeChildTab) {
        $(CHILD_CONTAINER).empty();

        if (callback) {
            callback();
        }

        return;
    }

    const childTab = CHILD_TABS[activeChildTab];

    if (childTab && TABS[childTab.tabName] && TABS[childTab.tabName].cleanup) {
        TABS[childTab.tabName].cleanup(function () {
            $(CHILD_CONTAINER).empty();
            TABS.telemetry.activeChildTab = null;

            if (callback) {
                callback();
            }
        });

        return;
    }

    $(CHILD_CONTAINER).empty();
    TABS.telemetry.activeChildTab = null;

    if (callback) {
        callback();
    }
}

function loadChildTab(childTabName, callback) {
    const childTab = CHILD_TABS[childTabName];

    if (!childTab) {
        if (callback) {
            callback();
        }

        return;
    }

    if (TABS.telemetry.childLoading) {
        return;
    }

    if (TABS.telemetry.activeChildTab === childTabName) {
        setVisibleSubtab(childTabName);

        if (callback) {
            callback();
        }

        return;
    }

    const loadToken = ++TABS.telemetry.loadToken;

    setVisibleSubtab(childTabName);
    setChildLoading(true);

    cleanupChildTab(function () {
        if (loadToken !== TABS.telemetry.loadToken || GUI.active_tab !== 'telemetry') {
            return;
        }

        setVisibleSubtab(childTabName);

        TABS.telemetry.activeChildTab = childTabName;

        TABS[childTab.tabName].initialize(function () {
            if (loadToken !== TABS.telemetry.loadToken || GUI.active_tab !== 'telemetry') {
                return;
            }

            GUI.active_tab = 'telemetry';

            i18n.localize();
            GUI.switchery();

            setChildLoading(false);

            if (callback) {
                callback();
            }
        }, {
            embedded: true,
            target: CHILD_CONTAINER,
        });
    });
}

TABS.telemetry.initialize = function (callback) {
    if (GUI.active_tab !== 'telemetry') {
        GUI.active_tab = 'telemetry';
    }

    TABS.telemetry.activeChildTab = null;
    TABS.telemetry.childLoading = false;

    const initializeToken = ++TABS.telemetry.loadToken;

    GUI.load(path.join(__dirname, 'telemetry.html'), function () {
        if (initializeToken !== TABS.telemetry.loadToken || GUI.active_tab !== 'telemetry') {
            return;
        }

        const $root = $('.tab-telemetry');

        i18n.localize();

        $root.find('.subtab__header_label')
            .off('click.telemetry')
            .on('click.telemetry', function () {
                if (TABS.telemetry.childLoading) {
                    return;
                }

                const childTabName = $(this).data('telemetry-tab');

                loadChildTab(childTabName);
            });

        loadChildTab('osd', function () {
            GUI.content_ready(callback);
        });
    });
};

TABS.telemetry.cleanup = function (callback) {
    TABS.telemetry.loadToken += 1;

    setChildLoading(false);

    $('.tab-telemetry .subtab__header_label').off('click.telemetry');

    cleanupChildTab(function () {
        $(CHILD_CONTAINER).empty();

        TABS.telemetry.activeChildTab = null;
        TABS.telemetry.childLoading = false;

        if (callback) {
            callback();
        }
    });
};