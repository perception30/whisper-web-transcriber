Have a look at demo_project_2/index.html

Our npm package ( whisper-web-transcriber ) works fine.
However, it requires the user to include file from node modules manully which is a bit inefficient.

Also, we cannot unpkg as web worker needs to be loaded from same origin.

Think carefully after reviewing all package related config and code modules.

Suggest best alternatives.
