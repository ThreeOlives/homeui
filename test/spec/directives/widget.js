"use strict";

describe("Directive: widget", () => {
  var f, deleted;
  beforeEach(module("homeuiApp.mqttDirectiveFixture"));

  beforeEach(inject((MqttDirectiveFixture) => {
    f = new MqttDirectiveFixture("<widget source='widget' on-delete='deleteWidget()'></widget>");
    f.extClient.send("/devices/dev1/meta/name", "Dev1", true, 1);
    f.extClient.send("/devices/dev1/controls/temp1/meta/type", "temperature", true, 1);
    f.extClient.send("/devices/dev1/controls/temp1/meta/name", "Temp 1", true, 1);
    f.extClient.send("/devices/dev1/controls/temp1", "42", true, 0);
    f.extClient.send("/devices/dev1/controls/voltage1/meta/type", "voltage", true, 1);
    f.extClient.send("/devices/dev1/controls/voltage1/meta/name", "Voltage 1", true, 1);
    f.extClient.send("/devices/dev1/controls/voltage1", "231", true, 0);
    f.extClient.send("/devices/dev2/controls/baz/meta/type", "text", true, 1);
    f.extClient.send("/devices/dev2/controls/baz", "qqq", true, 0);
    f.$scope.widget = {
      name: "Some widget",
      compact: true,
      cells: [
        { id: "dev1/temp1" },
        { id: "dev1/voltage1" }
      ]
    };
    deleted = false;
    f.$scope.deleteWidget = () => {
      expect(deleted).toBe(false);
      deleted = true;
    };
    f.$scope.$digest();
  }));

  afterEach(() => {
    $(".ui-select-container").remove();
    f.remove();
  });

  it("should display widget title", () => {
    expect(f.container.find(".widget .panel-heading .widget-name")).toHaveText("Some widget");
  });

  function extractCell (el) {
    el = $(el);
    var cell = {};
    if (el.find("h4").size())
      cell.name = el.find("h4").text();
    if (el.find("input").size())
      cell.value = el.find("input").val();
    else if (el.find(".value").size())
      cell.value = el.find(".value").text();
    if (el.find(".units").size())
      cell.units = el.find(".units").text();
    return cell;
  }

  function extractCells () {
    return f.container.find(".display-cell").toArray().map(extractCell);
  }

  it("should display cell values and units in compact mode", () => {
    expect(extractCells()).toEqual([
      { value: "42", units: "°C" },
      { value: "231", units: "V" }
    ]);
  });

  it("should display cell names in non-compact mode", () => {
    f.$scope.widget.compact = false;
    f.$scope.$digest();
    expect(extractCells()).toEqual([
      { name: "Temp 1", value: "42", units: "°C" },
      { name: "Voltage 1", value: "231", units: "V" }
    ]);
  });

  it("should support overriding cell names", () => {
    f.$scope.widget.compact = false;
    f.$scope.widget.cells[0].name = "New name";
    f.$scope.$digest();
    expect(extractCells()).toEqual([
      { name: "New name", value: "42", units: "°C" },
      { name: "Voltage 1", value: "231", units: "V" }
    ]);
  });

  function edit () {
    f.click(".glyphicon-edit");
  }

  function submit () {
    f.click("button[type=submit]");
  }

  it("should support edititing widget name", () => {
    edit();
    var nameInput = f.container.find(".panel-heading input[type=text]");
    expect(nameInput).toExist();
    expect(nameInput).toHaveValue("Some widget");
    nameInput.val("Foobar").change();

    // not changed yet
    expect(f.$scope.widget.name).toBe("Some widget");

    submit();
    expect(f.$scope.widget.name).toBe("Foobar");
  });

  it("should not allow blank widget names", () => {
    edit();
    f.container.find(".panel-heading input[type=text]").val("").change();
    submit();
    expect(f.container.find(".editable-error:visible")).toContainText("Empty widget name is not allowed");
  });

  it("should make cell names editable when in edit mode", () => {
    edit();
    expect(".display-cell").not.toExist();
    expect(f.container.find("tbody > tr").toArray().map(tr => $(tr).find("input[type=text]").val()))
      .toEqual([
        "Temp 1",
        "Voltage 1"
      ]);
    f.container.find("tbody > tr:eq(0) input[type=text]").val("Temperature").change();
    expect(angular.copy(f.$scope.widget.cells)).toEqual([
      { id: "dev1/temp1" },
      { id: "dev1/voltage1" }
    ]);
    submit();
    expect(angular.copy(f.$scope.widget.cells)).toEqual([
      { id: "dev1/temp1", name: "Temperature" },
      { id: "dev1/voltage1" }
    ]);
  });

  it("should revert cell name to default if it's set to empty", () => {
    f.$scope.widget.cells[0].name = "Temperature";
    f.$scope.$digest();
    edit();
    expect(f.container.find("tbody > tr").toArray().map(tr => $(tr).find("input[type=text]").val()))
      .toEqual([
        "Temperature",
        "Voltage 1"
      ]);
    f.container.find("tbody > tr:eq(0) input[type=text]").val("").change();
    submit();
    expect(angular.copy(f.$scope.widget.cells)).toEqual([
      { id: "dev1/temp1" },
      { id: "dev1/voltage1" }
    ]);
  });

  it("should support adding cells", () => {
    expect(".ui-select-match").not.toExist();
    edit();
    expect(".ui-select-match").toExist();
    f.container.find(".ui-select-match .ui-select-toggle").click();
    var el = $(".ui-select-container a.ui-select-choices-row-inner:contains(baz)");
    expect(el).toExist();
    el.click();
    expect(angular.copy(f.$scope.widget.cells)).toEqual([
      { id: "dev1/temp1" },
      { id: "dev1/voltage1" }
    ]);
    // cell picker must be cleared
    expect(f.container.find(".ui-select-match")).not.toContainText("dev2 / baz");
    expect(f.container.find("tbody > tr:eq(2) input[type=text]")).toHaveValue("baz");
    submit();
    expect(angular.copy(f.$scope.widget.cells)).toEqual([
      { id: "dev1/temp1" },
      { id: "dev1/voltage1" },
      { id: "dev2/baz" }
    ]);
  });

  it("should support filtering cells to be added by type", () => {
    edit();
    var typeSelect = f.container.find("select[name=type-filter]");
    expect(typeSelect).toHaveLength(1);
    expect(typeSelect.val()).toBe("any");
    var types = typeSelect.find("option").toArray().map(opt => $(opt).text());
    expect(types).toContain("value");
    expect(types).toContain("text");
    expect(types).toContain("temperature");
    typeSelect.find("option[value=text]").attr("selected", "selected");
    typeSelect.find("option[value=any]").removeAttr("selected");
    typeSelect.change();
    f.container.find(".ui-select-match .ui-select-toggle").click();
    expect($(".ui-select-container a.ui-select-choices-row-inner:contains(Dev1)")).not.toExist();
    expect($(".ui-select-container a.ui-select-choices-row-inner:contains(dev2 / baz)")).toExist();

    typeSelect.find("option[value=any]").attr("selected", "selected");
    typeSelect.find("option[value=text]").removeAttr("selected");
    typeSelect.change();
    expect(typeSelect.val()).toBe("any");
    expect($(".ui-select-container a.ui-select-choices-row-inner:contains(Dev1)")).toExist();
    expect($(".ui-select-container a.ui-select-choices-row-inner:contains(dev2 / baz)")).toExist();
  });

  it("should not add duplicate cells", () => {
    edit();
    f.container.find(".ui-select-match .ui-select-toggle").click();
    var el = $(".ui-select-container a.ui-select-choices-row-inner:contains(Temp 1)");
    expect(el).toExist();
    el.click();
    submit();
    expect(angular.copy(f.$scope.widget.cells)).toEqual([
      { id: "dev1/temp1" },
      { id: "dev1/voltage1" }
    ]);
  });

  it("should support cell removal", () => {
    edit();
    f.click("tbody > tr:eq(1) button[name=delete]");
    expect(angular.copy(f.$scope.widget.cells)).toEqual([
      { id: "dev1/temp1" },
      { id: "dev1/voltage1" }
    ]);
    submit();
    expect(angular.copy(f.$scope.widget.cells)).toEqual([
      { id: "dev1/temp1" }
    ]);
  });

  it("should not allow saving widget without cells", () => {
    edit();
    expect(f.container.find(".widget-error:visible")).not.toBeVisible();
    f.click("tbody > tr:eq(0) button[name=delete]");
    f.click("tbody > tr:eq(0) button[name=delete]");
    expect(f.container.find("button[type=submit]")).toBeDisabled();
  });

  it("should make it possible to cancel changes made during an edit", () => {
    edit();
    f.container.find("tbody > tr:eq(0) input[type=text]").val("Temperature").change();
    f.click("tbody > tr:eq(1) button[name=delete]");
    f.container.find(".ui-select-match .ui-select-toggle").click();
    $(".ui-select-container a.ui-select-choices-row-inner:contains(baz)").click();
    f.click("button[name=cancel]");

    expect(f.container.find(".panel-heading input[type=text]")).not.toBeVisible();
    expect(angular.copy(f.$scope.widget.cells)).toEqual([
      { id: "dev1/temp1" },
      { id: "dev1/voltage1" }
    ]);
    expect(extractCells()).toEqual([
      { value: "42", units: "°C" },
      { value: "231", units: "V" }
    ]);
  });

  it("should ignore source changes during edit", () => {
    edit();
    f.$scope.widget.cells[0].name = "This is ignored";
    f.$scope.$digest();
    expect(f.container.find("tbody > tr").toArray().map(tr => $(tr).find("input[type=text]").val()))
      .toEqual([
        "Temp 1",
        "Voltage 1"
      ]);
  });

  function ckCompact () {
    return f.container.find("input[name=compact][type=checkbox]");
  }

  it("should support toggling compact mode", () => {
    edit();
    expect(ckCompact()).toExist();
    expect(ckCompact()).toBeChecked();
    ckCompact().click();
    submit();
    expect(extractCells()).toEqual([
      { name: "Temp 1", value: "42", units: "°C" },
      { name: "Voltage 1", value: "231", units: "V" }
    ]);

    edit();
    expect(ckCompact()).toExist();
    expect(ckCompact()).not.toBeChecked();
    ckCompact().click();
    submit();
    expect(extractCells()).toEqual([
      { value: "42", units: "°C" },
      { value: "231", units: "V" }
    ]);
  });

  it("should invoke deletion handler upon widget deletion button click", () => {
    expect(deleted).toBe(false);
    f.click(".widget-button-delete");
    expect(deleted).toBe(true);
  });
});