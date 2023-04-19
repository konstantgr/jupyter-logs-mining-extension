# Jupyter Logs Mining Extension

# Installation

For using the extension, first you should to install allowed version of `notebook` and
`jupyter-contrib-nbextensions` packages.

```bash
pip install notebook==6.4.12
pip install jupyter-contrib-nbextensions==0.7.0
```

Then, install the extension, install and enable it

```bash
pip install git+https://github.com/konstantgr/jupyter-logs-mining-extension.git@python_extension
jupyter nbextension install --py mining_extension --user
jupyter nbextension enable --py mining_extension --user 
```

To start using the extension, check the checkbox in the extension description on the main Jupyter page and configure the
url of the remote server.

# About

## Description

This extension mines cell execution logs and designed to provide detailed
information about the execution sequence of notebooks. This extension tracks various events related to cell execution,
including the execution of cells, creation of new cells, deletion of cells, and any errors that occur during or after
execution. It also records the time of each cell execution, providing a comprehensive view of the notebook's execution
timeline.

In addition to cell execution logs, this extension also captures notebook general logs such as kernel interruption and
restart, as well as any notebook renaming events. This feature allows users to monitor their iterative development
process.

## Remote server configuration

Additionally, it is important to note that this Jupyter notebook extension has the capability to send the recorded data
to a remote server for further analysis or storage. This feature can be customized using a `URL` parameter, allowing
users
to specify the destination server.

## Agreement of sending the data

However, it is important to emphasize that the use of this data sharing feature is entirely optional and requires the
user to explicitly check a checkbox to enable it. This is to ensure that user privacy and data security are maintained
at all times.
