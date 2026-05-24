'use strict';

const path = require('path');

const { GUI, TABS } = require('./../js/gui');
const i18n = require('./../js/localization');

require('./osd');
require('./sensors');

TABS.telemetry = {};

TABS.telemetry.activeChildTab = null;

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

function loadChildTab(childTabName) {
    const childTab = CHILD_TABS[childTabName];

    if (!childTab) {
        return;
    }

    if (TABS.telemetry.activeChildTab === childTabName) {
        setVisibleSubtab(childTabName);
        return;
    }

    setVisibleSubtab(childTabName);

    cleanupChildTab(function () {
        setVisibleSubtab(childTabName);

        TABS.telemetry.activeChildTab = childTabName;
        TABS[childTab.tabName].initialize(function () {

            GUI.active_tab = 'telemetry';

            i18n.localize();
            GUI.switchery();
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

    GUI.load(path.join(__dirname, 'telemetry.html'), function () {
        const $root = $('.tab-telemetry');

        i18n.localize();

        $root.find('.subtab__header_label')
            .off('click.telemetry')
            .on('click.telemetry', function () {
                const childTabName = $(this).data('telemetry-tab');
                loadChildTab(childTabName);
            });
        GUI.content_ready(callback);

        loadChildTab('osd');
    });
};

TABS.telemetry.cleanup = function (callback) {
    $('.tab-telemetry .subtab__header_label').off('click.telemetry');

    cleanupChildTab(function () {
        $(CHILD_CONTAINER).empty();

        if (callback) {
            callback();
        }
    });
};