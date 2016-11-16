Stop Using Console.log in the node Code 

The console functions are usually asynchronous unless the destination is a file. Disks are fast and operating systems normally employ write-back caching; it should be a very rare occurrence indeed that a write blocks, but it is possible.

Additionally, console functions are blocking when outputting to TTYs (terminals) on OS X as a workaround for the OS's very small, 1kb buffer size. This is to prevent interleaving between stdout and stderr

Reference :https://nodejs.org/api/console.html#console_asynchronous_vs_synchronous_consoles


Install Node inspector 

npm install -g node-inspector
 
Run your application on debug mode 
   1. open a terminal  
   2. node --debug /src/app.js(give the exact path for app.js)
Run you node inspector in another terminal 
   1.node-inspector 
   
Start debugging    
   
 