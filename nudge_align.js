#!/usr/bin/env node

"use strict";

var http = require("http"),
    querystring = require("querystring"),
    child_process = require("child_process");

function writeCSS(res) {
    res.writeHead(200, {
        "Content-Type": "text/css"
    });

    res.write("/* style.css - this space intentionally left blank */");
    res.end();
}

function beginPage(res, title) {
    res.write("<!DOCTYPE html>\n");
    res.write("<html lang='en'>\n");
    res.write("<head>\n");
    res.write("<meta charset='utf-8'>\n");
    res.write("<title>"+ title + "</title>\n");
  res.write("<link rel='stylesheet' href='http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css'>"); //1
  res.write("<script src='https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js'></script>"); //2
  res.write("<script src='http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js'></script>"); //3

    //res.write("<link rel='stylesheet' href='css/bootstrap.min.css' type='text/css'>\n");
    //res.write("<link rel='stylesheet' href='style.css' type='text/css'>\n");
    res.write("</head>\n");
    res.write("<body>\n");
    //res.write("<div class='container'>"); //4
    //res.write("<div class='jumbotron'>"); //5
}

function endPage(res) {
    //res.write("</div>");
    //res.write("</div>");
    // res.write("<script src='http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.11.2.min.js'></script>"); 
    // res.write("<script src='js/bootstrap.js'></script>");
    res.write("</body>\n");
    res.write("</html>\n");
    res.end();
}

function writeHeading(res, tag, title) {
    
    res.write("<" + tag + ">" + title + "</" + tag + ">\n");
    //res.write("</div>");
    //res.write("</div>");
}

function writePre(res, divClass, data) {
    var escaped = data.replace(/</, "&lt;").
                       replace(/>/, "&gt;");

    res.write("<div class='" + divClass + "_div'>\n");
    res.write("<pre>");
    res.write(escaped);
    res.write("</pre>\n");
    res.write("</div>\n");
}

function beginForm(res) {
    res.write("<form class='form-inline' method='POST' action='/push'>\n"); //new1
    
}

function endForm(res) {
    res.write("<input type='submit' class='form-control' value='Push'>\n"); //new3
    
    res.write("</form>\n");
}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

function beginSelect(res, what) {
    res.write("<div class='form-group'>"); //new2
    res.write("<div class='form-control'>");//new4
   res.write("<div class='" + what + "_div'>\n");
   res.write("<label for='" + what + "_select' class='form-control'>" + capitalize(what) + "</label>\n"); //new5
    res.write("<select id='" + what + "_select' name='" + what + "'>\n");
}

function writeOption(res, option) {
    res.write("<option value='" + option + "'>" + option + "</option>\n");
}

function endSelect(res) {
    res.write("</select>\n");
   res.write("</div>\n");
res.write("</div>\n"); //new6
res.write("</div>\n"); //new7
}

function gitRemote(res) {
    child_process.exec("git remote", function(err, stdout, stderr) {
        if (err) {
            writeHeading(res, "h2", "Error listing remotes");
            writePre(res, "error", stderr);
            endPage(res);
        } else {
            var output = stdout.toString(),
                remotes = output.split(/\n/);
             
          //    res.write("<div class='col-md-6'>"); //3
            
            beginSelect(res, "remote");

          //    res.write("</div>"); //1
         //   res.write("</div>");   //3
          //  res.write("</div>");  //4
            remotes.forEach(function(remoteName) {
                if (remoteName) {
                    writeOption(res, remoteName);
                }
            });

            endSelect(res);
            endForm(res);
            endPage(res);
        }
    });
}

function gitBranch(res) {
    child_process.exec("git branch", function(err, stdout, stderr) {
        if (err) {
            writeHeading(res, "h2", "Error listing branches");
            writePre(res, "error", stderr);
            endPage(res);
        } else {
            var output = stdout.toString(),
                branches = output.split(/\n/);

            beginForm(res);
        //      res.write("<div class='container'>");   //1
         //    res.write("<div class='row'>"); //2
         //    res.write("<div class='col-md-4'>"); //1

            beginSelect(res, "branch");
          //  res.write("</div>");   //2
            
            branches.forEach(function(branch) {
                var branchName = branch.replace(/^\s*\*?\s*/, "").
                                        replace(/\s*$/, "");

                if (branchName) {
                    writeOption(res, branchName);
                }
            });

            endSelect(res);
            gitRemote(res);
        }
    });
}

function gitStatus(res) {
    child_process.exec("git status", function(err, stdout, stderr) {
        if (err) {
            writeHeading(res, "h2", "Error retrieving status");
            writePre(res, "error", stderr);
            endPage(res);
        } else {
            writeHeading(res, "h2", "Git Status");
            writePre(res, "status", stdout);
            gitBranch(res);
        }
    });
}

function gitPush(req, res) {
    var body = "";

    req.on("data", function(chunk) {
        body += chunk;
    });

    req.on("end", function () {
        var form = querystring.parse(body);

        child_process.exec("git push " + form.remote + " " + form.branch, function(err, stdout, stderr) {
            if (err) {
                writeHeading(res, "h2", "Error pushing repository");
                writePre(res, "error", stderr);
            } else {
                writeHeading(res, "h2", "Git Push");
                writePre(res, "push", stdout);
            }
            gitStatus(res);
        });
    });
}

function frontPage(req, res) {
    res.writeHead(200, {
        "Content-Type": "text/html"
    });

    if (req.url === "/style.css") {
        writeCSS(res);
    } else {
        var title = "Nudge - Web Interface for Git Push";
    
        beginPage(res, title);
    res.write("<div class='container'>"); //4
    res.write("<div class='jumbotron'>"); //5
        writeHeading(res, "h1", title);
    res.write("</div>");  //6
    res.write("</div>"); //7	

        if (req.method === "POST" && req.url === "/push") {
            gitPush(req, res);
        } else {
            gitStatus(res);
        }
    }
}

var server = http.createServer(frontPage);
server.listen();
var address = server.address();
console.log("nudge is listening at http://localhost:" + address.port + "/");
