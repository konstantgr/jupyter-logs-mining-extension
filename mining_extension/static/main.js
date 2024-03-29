define(['jquery', 'base/js/namespace', 'base/js/events',], function ($, Jupyter, events) {
    "use strict";

    function executePythonCommand(command) {
        return new Promise((resolve, reject) => {
            let output = '';
            Jupyter.notebook.kernel.execute(command, {
                iopub: {
                    output: function (data) {
                        output = data.content.text.trim();
                        resolve(output);
                    }
                }
            });
        });
    }

    const params = {
        url: "127.0.0.1",
        agreement: false,
    };


    const tracked_events = ['create.Cell', 'delete.Cell', 'execute.CodeCell', 'rendered.MarkdownCell', 'notebook_renamed.Notebook', 'kernel_interrupting.Kernel', 'kernel_restarting.Kernel', 'finished_execute.CodeCell'];

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
            method: 'POST', headers: {
                'Content-Type': 'application/json'
            }, body: json_data
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

        const s = JSON.stringify(json_data).replace(/(\r\n|\n|\r)/gm, "")
            .replace("[EVENT_SEPARATOR]", "")
            .replace(new RegExp("'", "g"), '\"');

        const command = `!echo '${s}[EVENT_SEPARATOR]' >> ${Jupyter.notebook.kernel.id}.log`
        Jupyter.notebook.kernel.execute(command)
    }

    function saveLogs(time, sessionId, kernelId, notebookName, event, cell, cellNumber) {
        let cellIndex;
        let cellSource;
        let cellOutput;
        let cell_type;
        if (cell === undefined) {
            cellSource = "";
            cellIndex = "";
            cell_type = "";
        } else {
            cellSource = cell.get_text();
            cellIndex = cell.cell_id;
            cell_type = cell.cell_type;
        }

        if (event === "finished_execute") {
            cellOutput = JSON.stringify(cell.toJSON().outputs.map(({output_type, execution_count, text, data}) => {
                let size = 0
                if (text) size += new TextEncoder().encode(JSON.stringify(text)).length;
                if (data) size += new TextEncoder().encode(JSON.stringify(data)).length;

                return {output_type, size}
            }));
        } else {
            cellOutput = null;
        }

        const logs = {
            "time": time,
            "kernel_id": kernelId,
            "notebook_name": notebookName,
            "event": event,
            "cell_index": cellIndex,
            "cell_num": cellNumber,
            "cell_source": cellSource,
            "cell_type": cell_type,
            "session_id": sessionId,
            "cell_output": cellOutput
        };

        sendRequest(JSON.stringify(logs));
    }

    function detectError(outputs) {
        if (!outputs || !outputs.length) return false

        for (const out of outputs) {
            if (out.output_type === "error") return out
        }
        return false
    }

    function registerEvents() {
        events.on(tracked_events.join(' '), function (evt, data) {
            const kernelId = Jupyter.notebook.kernel.id;
            const notebookName = Jupyter.notebook.notebook_name;
            const cellNumber = Jupyter.notebook.get_selected_index();
            const cell = data.cell
            const sessionId = Jupyter.notebook.session.id
            const time = (new Date()).toISOString()
            saveLogs(time, sessionId, kernelId, notebookName, evt.type, cell, cellNumber);

            if (evt.type === "finished_execute") {
                const error = detectError(data.cell.toJSON().outputs)
                if (error) {
                    delete error.traceback
                    const logs = {
                        "time": time,
                        "kernel_id": kernelId,
                        "notebook_name": notebookName,
                        "event": "error",
                        "cell_index": cell.cell_id,
                        "cell_num": cellNumber,
                        "cell_source": JSON.stringify(error),
                        "cell_type": cell.cell_type,
                        "session_id": sessionId
                    };
                    sendRequest(JSON.stringify(logs));
                }
            }
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

    function CellTypeChangeHandler() {
        const kernelId = Jupyter.notebook.kernel.id;
        const notebookName = Jupyter.notebook.notebook_name;
        const sessionId = Jupyter.notebook.session.id;
        const cell = Jupyter.notebook.get_selected_cell();
        const cellNum = Jupyter.notebook.get_selected_index();

        const new_type = $('#cell_type').val();
        let event;
        if (new_type === "code") {
            event = "to_code";
        } else if (new_type === "markdown") {
            event = "to_markdown";
        } else {
            event = "to_other";
        }

        console.log('Cell type changed to:', new_type, Jupyter.notebook.get_selected_cell().cell_id);

        const logs = {
            "time": (new Date()).toISOString(),
            "kernel_id": kernelId,
            "notebook_name": notebookName,
            "cell_index": cell.cell_id,
            "cell_num": cellNum,
            "cell_type": cell.cell_type,
            "event": event,
            "cell_source": cell.get_text(),
            "session_id": sessionId
        };

        sendRequest(JSON.stringify(logs));

    }

    function CellTypeComboboxListener() {
        $('#cell_type').on('change', CellTypeChangeHandler);
    }

    function saveCells() {
        const cells = Jupyter.notebook.get_cells();
        const notebook = [];

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i].toJSON();
            cell.id = cells[i].cell_id;
            delete cell.outputs;
            delete cell.metadata;

            notebook.push(cell);
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
            CellTypeComboboxListener();

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