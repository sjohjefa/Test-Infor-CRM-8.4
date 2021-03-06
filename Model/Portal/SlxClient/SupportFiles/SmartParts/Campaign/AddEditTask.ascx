<%@ Control Language="C#" AutoEventWireup="true" CodeFile="AddEditTask.ascx.cs" Inherits="SmartParts_Campaign_AddEditTask" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls.PickList" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls.DependencyLookup" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls.Lookup" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.SalesLogix.HighLevelTypes" Namespace="Sage.SalesLogix.HighLevelTypes" TagPrefix="SalesLogix" %>

<div style="display:none">
    <asp:Panel ID="Form_LTools" runat="server"></asp:Panel>
    <asp:Panel ID="Form_CTools" runat="server"></asp:Panel>
    <asp:Panel ID="Form_RTools" runat="server">
        <SalesLogix:PageLink ID="lnkHelp" runat="server" LinkType="HelpFileName" ImageUrl="~/ImageResource.axd?scope=global&type=Global_Images&key=Help_16x16"
            ToolTip="<%$ resources: Portal, Help_ToolTip %>" Target="Help" NavigateUrl="campaignaddeditcomptasks.aspx">
        </SalesLogix:PageLink>
    </asp:Panel>
    <asp:TextBox runat="server" ID="txtOwnerName" />
    <asp:TextBox runat="server" ID="txtOwnerType" />
    <asp:HiddenField runat="server" ID="Mode" />
</div>
<table id="Table2" class="formtable">
    <col width="50%" /><col width="50%" />
    <tr>
        <td colspan ="2">
            <div class="twocollbl">
                <asp:Label ID="lblDescription" AssociatedControlID="txtDecription" runat="server" Text="<%$ resources: lblDescription.Text %>"></asp:Label>
            </div>
            <div class="twocoltextcontrol" style="width:80%">
                <asp:TextBox runat="server" ID="txtDecription" MaxLength="64" dojoType="Sage.UI.Controls.TextBox"></asp:TextBox>
            </div>
        </td>
    </tr>
    <tr>
        <td>
            <div class="lbl alignright">
                <asp:Label ID="lblStatus" AssociatedControlID="pklStatus" runat="server" Text="<%$ resources: lblStatus.Text %>"></asp:Label>
            </div>
            <div class="textcontrol">
                <SalesLogix:PickListControl runat="server" ID="pklStatus" PickListId="" PickListName="Campaign Task Status" AutoPostBack="false"
                    NoneEditable="false" mustExistInlist="false" MaxLength="32" />
            </div>
        </td>
        <td>
            <div class="lbl alignright">
                <asp:Label ID="lblNeededDate" AssociatedControlID="dtNeededDate" runat="server" Text="<%$ resources: lblNeededDate.Text %>"></asp:Label>
            </div>
            <div class="textcontrol datepicker">
                <SalesLogix:DateTimePicker runat="server" ID="dtNeededDate" DisplayDate="true" DisplayTime="false" Timeless="True" Enabled="true"/>
            </div>
        </td>
    </tr>
    <tr>
        <td>
            <div class="lbl alignright">
                <asp:Label ID="lblPrority" AssociatedControlID="pklPriority" runat="server" Text="<%$ resources: lblPriority.Text %>"></asp:Label>
            </div>
            <div class="textcontrol">
                <SalesLogix:PickListControl runat="server" ID="pklPriority" PickListId="" PickListName="Campaign Task Priority" AutoPostBack="false"
                    NoneEditable="false" mustExistInlist="false" MaxLength="32"/>
            </div>
        </td>
        <td>
            <div class="lbl alignright">
                <asp:Label ID="lblCompletedDate" AssociatedControlID="dtCompletedDate" runat="server" Text="<%$ resources: lblCompletedDate.Text %>"></asp:Label>
            </div>
            <div class="textcontrol datepicker">
                <SalesLogix:DateTimePicker runat="server" ID="dtCompletedDate" DisplayDate="true" DisplayTime="false" Timeless="True" Enabled="true"/>
            </div>
        </td>
    </tr>
    <tr>    
        <td>  
            <div class="lbl alignright">
                <asp:Label ID="lblPercent" AssociatedControlID="txtPercentComplete" runat="server" Text="<%$ resources: lblPercentComplete.Text %>"></asp:Label>
            </div>
            <div class="textcontrol">
                <asp:TextBox runat="server" ID="txtPercentComplete" dojoType="Sage.UI.Controls.TextBox"></asp:TextBox>
            </div>
        </td>
        <td></td>
    </tr>
    <tr>
        <td colspan="2">
            <div class="twocollbl">
                <asp:Label ID="lblComment" AssociatedControlID="txtComment" runat="server" Text="<%$ resources: lblComment.Text %>"></asp:Label>
            </div>
            <div class="twocoltextcontrol TEXTAREA" style="width:80%">
                <asp:TextBox runat="server" ID="txtComment" TextMode="MultiLine" Rows="4" />
            </div>
        </td>
    </tr>
</table>

<table class="formtable">
    <col width="50%" /><col width="50%" />
    <tr>
        <td colspan="2">
            <div class="mainContentHeader">
                <span id="Span2">
                    <asp:Label ID="lbBudget" runat="server" Text="<%$ resources: lblBudget.Text %>"></asp:Label>
                </span>
            </div>
        </td>
    </tr>
    <tr>
        <td>
            <div class="lbl alignright">
                <asp:Label ID="lblEstimatedCost" runat="server" AssociatedControlID="slxCurEstimatedCost" Text="<%$ resources: lblEstimatedCost.Text %>"></asp:Label>
            </div>
            <div class="textcontrol currency">
                <SalesLogix:Currency runat="server" ID="slxCurEstimatedCost" ExchangeRateType="BaseRate" Enabled="true" DisplayCurrencyCode="false" />
            </div>
        </td>
        <td>
            <div class="lbl alignright">
                <asp:Label ID="lblActualCost" runat="server" AssociatedControlID="slxCurActualCost" Text="<%$ resources: lblActualCost.Text %>"></asp:Label>
            </div>
            <div class="textcontrol currency">
                <SalesLogix:Currency runat="server" ID="slxCurActualCost" ExchangeRateType="BaseRate" Enabled="true" DisplayCurrencyCode="false" />
            </div>
        </td>
    </tr>
    <tr>
        <td>
            <div class="lbl alignright">
                <asp:Label ID="lblEstimatedHours" runat="server" AssociatedControlID="numEstimatedHours" Text="<%$ resources: lblEstimatedHours.Text %>"></asp:Label>
            </div>
            <div class="textcontrol numeric">
                <SalesLogix:NumericControl runat="server" ID="numEstimatedHours" ReadOnly="false" FormatType="Decimal" />
            </div>
        </td>
        <td>
            <div class="lbl alignright">
                <asp:Label ID="lblActualHours" runat="server" AssociatedControlID="numActualHours" Text="<%$ resources: lblActualHours.Text %>"></asp:Label>
            </div>
            <div class="textcontrol numeric">
                <SalesLogix:NumericControl runat="server" ID="numActualHours" ReadOnly="false" FormatType="Decimal" />
            </div>
        </td>
    </tr>
</table>

<table id="tblAssignment"class="formtable">
    <col width="50%" /><col width="50%" />
    <tr>
        <td colspan="2">
            <div class="mainContentHeader">
                <span id="Span1">
                    <asp:Label ID="lblAssignment" runat="server" Text="<%$ resources: lblAssignment.Text %>"></asp:Label>
                </span>
            </div>
        </td>
    </tr>
    <tr>
        <td>
            <div class="lbl">
                <asp:Label ID="lblAssignTo1" runat="server" Text="<%$ resources: lblAssignTo.Text %>"></asp:Label>
            </div>
            <asp:RadioButtonList runat="server" ID="rdgAssignTo" RepeatDirection="vertical" >
                <asp:ListItem Text="<%$ resources: rdlUserTeam.Text %>" Selected="True" Value="0" />
                <asp:ListItem Text="<%$ resources: rdlDepartment.Text %>" Value="1" />
                <asp:ListItem Text="<%$ resources: rdlContact.Text %>" Value="2" />
                <asp:ListItem Text="<%$ resources: rdlOther.Text %>" Value="3" />
                <asp:ListItem Text="<%$ resources: rdlNone.Text %>" Value="4" />
            </asp:RadioButtonList>
        </td>
        <td>
            <table id="tblAssignment2" width="100%">
                <tr>
                    <td>
                        <div class="lbl">
                            <asp:Label ID="lblAssignTo2" runat="server" Text="<%$ resources: lblAssignTo.Text %>"></asp:Label>
                        </div>
                        <div id="opt0" style="display:none" runat="server" class="textcontrol owner">
                            <SalesLogix:OwnerControl runat="server" ID="slxOwner"></SalesLogix:OwnerControl>
                        </div>
                        <div id="opt1" style="display:none" class="textcontrol lookup" runat="server">
                            <asp:DropDownList ID="ddlDepartments" data-dojo-type="Sage.UI.Controls.Select" CssClass="select-control" runat="server" AutoPostBack="false"></asp:DropDownList>
                        </div>
                        <div id="opt2" style="display:none" class="textcontrol lookup" runat="server">
                            <SalesLogix:LookupControl runat="server" ID="luContact" LookupDisplayMode="Dialog" LookupEntityName="Contact" 
                                LookupBindingMode="String" ReturnPrimaryKey="true" LookupEntityTypeName="Sage.Entity.Interfaces.IContact, Sage.Entity.Interfaces, Version=0.0.0.0, Culture=neutral, PublicKeyToken=null"  >
                                <LookupProperties>
                                    <SalesLogix:LookupProperty PropertyHeader="<%$ resources: luLastName.PropertyHeader %>" PropertyName="LastName"
                                        PropertyType="System.String" PropertyFormat="None"  UseAsResult="True"></SalesLogix:LookupProperty>
                                    <SalesLogix:LookupProperty PropertyHeader="<%$ resources: luFirstName.PropertyHeader %>" PropertyName="FirstName"
                                        PropertyType="System.String" PropertyFormat="None"  UseAsResult="True"></SalesLogix:LookupProperty>
                                    <SalesLogix:LookupProperty PropertyHeader="<%$ resources: luType.PropertyHeader %>" PropertyName="Type"
                                        PropertyType="System.String" PropertyFormat="None"  UseAsResult="True"></SalesLogix:LookupProperty>
                                    <SalesLogix:LookupProperty PropertyHeader="<%$ resources: luAccountName.PropertyHeader %>" PropertyName="AccountName"
                                        PropertyType="System.String" PropertyFormat="None"  UseAsResult="True"></SalesLogix:LookupProperty>
                                    <SalesLogix:LookupProperty PropertyHeader="<%$ resources: luWorkPhone.PropertyHeader %>" PropertyName="WorkPhone"
                                        PropertyType="System.String" PropertyFormat="None"  UseAsResult="True"></SalesLogix:LookupProperty>
                                </LookupProperties>
                                <LookupPreFilters></LookupPreFilters>
                            </SalesLogix:LookupControl>
                        </div>
                        <div id="opt3" style="display:none" runat="server" class="textcontrol">
                            <asp:TextBox runat="server" ID="txtOther" dojoType="Sage.UI.Controls.TextBox"></asp:TextBox>
                        </div>
                        <div id="opt4" style="display:none" runat="server" class="textcontrol">
                            <asp:TextBox runat="server" ID="txtNone" Text="<%$ resources: txtNone.NoneValue %>" ReadOnly="true" dojoType="Sage.UI.Controls.TextBox"></asp:TextBox>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="lbl alignleft">
                            <asp:Label ID="lblAssignDate" AssociatedControlID="dtAssignedDate" runat="server" Text="<%$ resources: lblAssignedDate.Text %>"></asp:Label>
                        </div>
                        <div class="textcontrol datepicker">
                            <SalesLogix:DateTimePicker runat="server" ID="dtAssignedDate" Enabled="true"/>
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td></td>
        <td>
            <asp:Panel runat="server" ID="ctrlstButtons" CssClass="controlslist qfActionContainer">
                <asp:Button runat="server" ID="cmdSave" Text="<%$ resources: cmdSave.Caption %>" CssClass="slxbutton" />
                <asp:Button runat="server" ID="cmdCancel" Text="<%$ resources: cmdCancel.Caption %>" CssClass="slxbutton" />
            </asp:Panel>
        </td>
    </tr>
</table>