// 'url' : 'http://3.249.245.244:9999/',

define([
    'jquery',
    'base/js/namespace',
    'base/js/events',
], function ($, Jupyter, events) {
    "use strict";

    const params = {
        url: "0.0.0.0",
        agreement: false
    };

    const tracked_events = [
        'create.Cell',
        'delete.Cell',
        'execute.CodeCell',
        'rendered.MarkdownCell',
        'notebook_renamed.Notebook',
        'kernel_interrupting.Kernel',
        'kernel_restarting.Kernel',
    ];

    const update_params = function () {
        const config = Jupyter.notebook.config;
        for (const key in params) {
            if (config.data.hasOwnProperty(key)) {
                params[key] = config.data[key];
            }
        }
    };

    function sendRequest(json_data) {
        fetch(params['url'], {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: json_data
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(json_data => {
                console.log(json_data);
            })
            .catch(error => {
                console.error('There was a problem with the request:', error);
            });
    }

    function logEvent(event) {
        console.log('Event:', event.type, event);
    }

    function saveLogs(time, sessionId, kernelId, notebookName, event, cell, cellNumber) {
        let cellIndex;
        let cellSource;
        if (cell === undefined) {
            cellSource = "";
            cellIndex = "";
        } else {
            cellSource = cell.get_text();
            cellIndex = cell.cell_id;
        }
        const logs = {
            "time": time,
            "kernel_id": kernelId,
            "notebook_name": notebookName,
            "event": event,
            "cell_index": cellIndex,
            "cell_num": cellNumber,
            "cell_source": cellSource,
            "session_id": sessionId
        };

        sendRequest(JSON.stringify(logs));
    }

    function registerEvents() {

        events.on(tracked_events.join(' '), function (evt, data) {
            const kernelId = Jupyter.notebook.kernel.id;
            const notebookName = Jupyter.notebook.notebook_name;
            const cellNumber = Jupyter.notebook.get_selected_index();
            const cell = data.cell
            const sessionId = Jupyter.notebook.session.id

            saveLogs((new Date()).toISOString(), sessionId, kernelId, notebookName, evt.type, cell, cellNumber);
        });
    }

    function DeleteUpAndDownButtons() {
        const btn_up = document.querySelector('.btn.btn-default[title="move selected cells up"]');
        const btn_down = document.querySelector('.btn.btn-default[title="move selected cells down"]');

        if (btn_up) {
            btn_up.parentNode.removeChild(btn_up);
        }
        if (btn_down) {
            btn_down.parentNode.removeChild(btn_down);
        }
    }

    function saveCells() {
        const cells = Jupyter.notebook.get_cells();
        const notebook = [];

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const cellData = cell.toJSON();
            notebook.push(cellData);
        }

        const content = JSON.stringify(notebook, null, 2);

        const kernelId = Jupyter.notebook.kernel.id;
        const notebookName = Jupyter.notebook.notebook_name;
        const sessionId = Jupyter.notebook.session.id

        const logs = {
            "time": (new Date()).toISOString(),
            "kernel_id": kernelId,
            "notebook_name": notebookName,
            "event": "save_notebook",
            "cell_source": content,
            "session_id": sessionId
        };

        sendRequest(JSON.stringify(logs));
    }

    function loadExtension() {
        update_params();
        if (params.agreement) {
            DeleteUpAndDownButtons();

            if (Jupyter.notebook) {
                Jupyter.notebook.events.one('kernel_ready.Kernel', function () {
                    saveCells();
                });
                registerEvents();
            }
        }
    }

    return {
        load_ipython_extension: loadExtension
    };
});