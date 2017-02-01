(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['connectionCard'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "        <h5>"
    + container.escapeExpression(((helper = (helper = helpers.username || (depth0 != null ? depth0.username : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"username","hash":{},"data":data}) : helper)))
    + "'s topics of interest</h5>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "                <li class=\"topic\">"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + ": "
    + alias4(((helper = (helper = helpers.position || (depth0 != null ? depth0.position : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"position","hash":{},"data":data}) : helper)))
    + "</li>\r\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper;

  return "It looks like the next time we're both available is "
    + container.escapeExpression(((helper = (helper = helpers.firstMatchingTime || (depth0 != null ? depth0.firstMatchingTime : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"firstMatchingTime","hash":{},"data":data}) : helper)))
    + ". Let me know if you're still free then and we can set something up. ";
},"7":function(container,depth0,helpers,partials,data) {
    return "It looks like we don't have any overlapping times at the moment, but maybe we can find time to set something up? Let me know! ";
},"9":function(container,depth0,helpers,partials,data) {
    var helper;

  return "                <span>The earliest time you're both available is <b>"
    + container.escapeExpression(((helper = (helper = helpers.firstMatchingTime || (depth0 != null ? depth0.firstMatchingTime : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"firstMatchingTime","hash":{},"data":data}) : helper)))
    + "</b>.</span>\r\n";
},"11":function(container,depth0,helpers,partials,data) {
    return "                <span>No Common Available Times at the moment...</span>\r\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"connection-card\" id=\"connection-card_"
    + alias4(((helper = (helper = helpers.username || (depth0 != null ? depth0.username : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"username","hash":{},"data":data}) : helper)))
    + "\" data-connectionid=\""
    + alias4(((helper = (helper = helpers.connectionId || (depth0 != null ? depth0.connectionId : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"connectionId","hash":{},"data":data}) : helper)))
    + "\">\r\n    <div class=\"user-info\">\r\n        <h4>About <span class=\"username\">"
    + alias4(((helper = (helper = helpers.username || (depth0 != null ? depth0.username : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"username","hash":{},"data":data}) : helper)))
    + "</span> - <span class=\"about-me\">"
    + alias4(((helper = (helper = helpers.aboutMe || (depth0 != null ? depth0.aboutMe : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"aboutMe","hash":{},"data":data}) : helper)))
    + "</span></h4>\r\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.topics : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        <ul class=\"topics-container\">\r\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.topics : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        </ul>\r\n        <p class=\"public-email-container\">\r\n            E-mail: <a href=\"mailto:"
    + alias4(((helper = (helper = helpers.publicEmail || (depth0 != null ? depth0.publicEmail : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"publicEmail","hash":{},"data":data}) : helper)))
    + "\"><span class=\"public-email\">"
    + alias4(((helper = (helper = helpers.publicEmail || (depth0 != null ? depth0.publicEmail : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"publicEmail","hash":{},"data":data}) : helper)))
    + "</span></a>\r\n        </p>\r\n        <div class=\"write-email-container\">\r\n            <textarea id=\"message-input\" rows=\"9\" cols=\"80\">Hello "
    + alias4(((helper = (helper = helpers.username || (depth0 != null ? depth0.username : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"username","hash":{},"data":data}) : helper)))
    + ", &#10;&#10;We connected on Phoenix and I'd like to get together. "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.firstMatchingTime : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(7, data, 0),"data":data})) != null ? stack1 : "")
    + "&#10;&#10;See you soon,&#10;&#10;"
    + alias4(((helper = (helper = helpers.myUsername || (depth0 != null ? depth0.myUsername : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"myUsername","hash":{},"data":data}) : helper)))
    + "\r\n            </textarea>\r\n        </div>\r\n        <div id=\"send-email-container\">\r\n            <button id=\"send-email-button\" class=\"btn\">Send</button>\r\n            <p id=\"email-sent-msg\">Email sent!</p>\r\n            <div id=\"send-email-loader\" class=\"loader\"></div>\r\n            <p id=\"email-send-error\">This email did not send. Click Send to try again.</p>\r\n        </div>\r\n    </div>\r\n    <div class=\"matching-time-and-connection-options\">\r\n        <div class=\"matching-time\">\r\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.firstMatchingTime : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(11, data, 0),"data":data})) != null ? stack1 : "")
    + "        </div>\r\n        <div class=\"connection-options\">\r\n            <button id=\"close-connection-btn\" class=\"btn\">Close Connection</button>\r\n        </div>\r\n    </div>\r\n</div>";
},"useData":true});
templates['dashboardListing'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div id=\"dashboard\">\r\n    <div>\r\n        <h3><span id=\"connection-header\">Your Connection</span></h3>\r\n        <div id=\"connection-container\">\r\n             <span id=\"empty-connection\">No connection just yet! <br/><br/>Remember, in order to connect you must <b>express your interest</b> in meeting some of your suggestions<span id=\"prompt-text\"> and <b><a id=\"prompt-signal-ready-for-next\" href=\"#\">say that you are ready to connect</a></b></span>.</span>\r\n        </div>\r\n    </div>\r\n    <div>\r\n        <h3><span id=\"suggestion-header\">Your Suggestions</span></h3>\r\n        <div id=\"suggestions-container\">\r\n            <span id=\"empty-suggestion\">Looks like you don't have any suggestions yet. Try going to your <a href=\"personal.html\">profile page</a> and making your\r\n            preferences a bit less strict?</span>\r\n        </div>\r\n    </div>\r\n</div>\r\n";
},"useData":true});
templates['note'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {};

  return "    <div class=\"form-group\" data-noteid=\""
    + container.escapeExpression(((helper = (helper = helpers.noteId || (depth0 != null ? depth0.noteId : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"noteId","hash":{},"data":data}) : helper)))
    + "\">\r\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.versions : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    </div>\r\n";
},"2":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "            <div class=\"version "
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.latest : depth0),{"name":"unless","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\r\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.latest : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(7, data, 0),"data":data})) != null ? stack1 : "")
    + "            </div>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "hidden previous";
},"5":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "                    <span>Made on "
    + alias4(((helper = (helper = helpers.writeDate || (depth0 != null ? depth0.writeDate : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"writeDate","hash":{},"data":data}) : helper)))
    + "</span>\r\n                    <textarea class=\"form-control update-note-input note-input\" rows=\"5\" maxlength=\"250\">"
    + alias4(((helper = (helper = helpers.content || (depth0 != null ? depth0.content : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"content","hash":{},"data":data}) : helper)))
    + "</textarea>\r\n                    <div id=\"counter\"><span id=\"count\">0</span>/250</div>\r\n                    <button class=\"update-note-btn btn\">Update</button>\r\n                    <button class=\"view-previous-note-btn btn\" data-active=\"false\">View Previous Versions</button>\r\n                    <button class=\"delete-note-btn btn\">Delete</button>\r\n";
},"7":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "                    <span>Made on "
    + alias4(((helper = (helper = helpers.writeDate || (depth0 != null ? depth0.writeDate : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"writeDate","hash":{},"data":data}) : helper)))
    + "</span>\r\n                    <div>"
    + alias4(((helper = (helper = helpers.content || (depth0 != null ? depth0.content : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"content","hash":{},"data":data}) : helper)))
    + "</div>\r\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers.unless.call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.deleted : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"useData":true});
templates['pastConnection'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return container.escapeExpression(((helper = (helper = helpers.closeDate || (depth0 != null ? depth0.closeDate : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"closeDate","hash":{},"data":data}) : helper)));
},"3":function(container,depth0,helpers,partials,data) {
    return "checked";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = container.invokePartial(partials.note,depth0,{"name":"note","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<tr class=\"connection\" data-connectionid=\""
    + alias4(((helper = (helper = helpers.connectionId || (depth0 != null ? depth0.connectionId : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"connectionId","hash":{},"data":data}) : helper)))
    + "\" data-connectusername=\""
    + alias4(((helper = (helper = helpers.connectUsername || (depth0 != null ? depth0.connectUsername : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"connectUsername","hash":{},"data":data}) : helper)))
    + "\">\r\n	<td>"
    + alias4(((helper = (helper = helpers.connectUsername || (depth0 != null ? depth0.connectUsername : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"connectUsername","hash":{},"data":data}) : helper)))
    + "</td>\r\n	<td>"
    + alias4(((helper = (helper = helpers.openDate || (depth0 != null ? depth0.openDate : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"openDate","hash":{},"data":data}) : helper)))
    + "</td>\r\n	<td>"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.closeDate : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</td>\r\n    <td><input "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.stillInterested : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + " type=\"checkbox\" class=\"still-interested\"></td>\r\n    <td class=\"notes\">\r\n        <div class=\"form-group\" id=\"new-note-container\">\r\n            <textarea class=\"form-control new-note-input note-input\" rows=\"5\" maxlength=\"250\"></textarea>\r\n            <div id=\"counter\"><span id=\"count\">0</span>/250</div>\r\n            <button class=\"add-note-btn btn\">Add Note</button>\r\n        </div>\r\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.notes : depth0),{"name":"each","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    </td>\r\n</tr>";
},"usePartial":true,"useData":true});
templates['sidebar'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper;

  return "<a href=\"index.html\"><img src=\"/images/phoenix-cc-2.png\"></a><!--Original design adapted from Razlan Hanafiah-->\r\n<ul>\r\n	<li id=\"dashboard-item\"><a class = \"sidebar-link\" href=\"index.html\">Dashboard</a></li>\r\n	<li id=\"personal-item\"><a class = \"sidebar-link\" href=\"personal.html\">Personal</a></li>\r\n	<li id=\"journal-item\"><a class = \"sidebar-link\" href=\"journal.html\">Journal</a></li>\r\n	<li id=\"faq-item\"><a class = \"sidebar-link\" href=\"faq.html\">FAQ</a></li>\r\n</ul>\r\n<div class=\"row\" id=\"sidebar-username-and-signout\">\r\n        <span id=\"sidebar-username\">"
    + container.escapeExpression(((helper = (helper = helpers.username || (depth0 != null ? depth0.username : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"username","hash":{},"data":data}) : helper)))
    + "</span>\r\n        <button id=\"signout\" class=\"btn btn-primary\">Log Out</button>\r\n</div>";
},"useData":true});
templates['suggestionCard'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "        <h5>"
    + container.escapeExpression(((helper = (helper = helpers.username || (depth0 != null ? depth0.username : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"username","hash":{},"data":data}) : helper)))
    + "'s topics of interest</h5>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "                <li class=\"topic\">"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + ": "
    + alias4(((helper = (helper = helpers.position || (depth0 != null ? depth0.position : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"position","hash":{},"data":data}) : helper)))
    + "</li>\r\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "checked";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"suggestion-card\" id=\"suggestion-card_"
    + alias4(((helper = (helper = helpers.username || (depth0 != null ? depth0.username : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"username","hash":{},"data":data}) : helper)))
    + "\">\r\n    <div class=\"user-info\">\r\n        <h4>\r\n            About <span class=\"username\">"
    + alias4(((helper = (helper = helpers.username || (depth0 != null ? depth0.username : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"username","hash":{},"data":data}) : helper)))
    + "</span> - <span class=\"about-me\">"
    + alias4(((helper = (helper = helpers.aboutMe || (depth0 != null ? depth0.aboutMe : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"aboutMe","hash":{},"data":data}) : helper)))
    + "</span>\r\n        </h4>\r\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.topics : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        <ul class=\"topics-container\">\r\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.topics : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        </ul>\r\n    </div>\r\n    <div class=\"interest\">\r\n        <label for=\"interested-checkbox\">Interested?</label>\r\n            <input type=\"checkbox\" class=\"interested-checkbox\" "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.interested : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">\r\n    </div>\r\n</div>";
},"useData":true});
})();