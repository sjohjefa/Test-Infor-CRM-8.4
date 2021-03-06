<%@ Control Language="C#" AutoEventWireup="true" CodeFile="StagesAndTasks.ascx.cs" Inherits="SmartParts_StagesAndTasks" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>

<div style="display:none">
    <asp:Panel ID="Stages_LTools" runat="server"></asp:Panel>
    <asp:Panel ID="Stages_CTools" runat="server"></asp:Panel>
    <asp:Panel ID="Stages_RTools" runat="server">
        <asp:ImageButton runat="server" ID="btnAddStage" ToolTip="Add Stage" meta:resourcekey="btnAddStage" 
            ImageUrl="~\images\icons\plus_16X16.gif"  />
        <SalesLogix:PageLink ID="lnkStageTaskHelp" runat="server" LinkType="HelpFileName"  NavigateUrl="campaignstagestaskstab.aspx"
            ToolTip="<%$ resources: Portal, Help_ToolTip %>" Target="Help" ImageUrl="~/ImageResource.axd?scope=global&type=Global_Images&key=Help_16x16">
        </SalesLogix:PageLink>
    </asp:Panel>
</div>
<SalesLogix:SlxGridView runat="server" ID="grdStages" GridLines="None" AutoGenerateColumns="False" CellPadding="4" CssClass="datagrid"
    AlternatingRowStyle-CssClass="dojoxGridRowOdd" RowStyle-CssClass="dojoxGridRow" HeaderStyle-CssClass="dojoxGridHeader" ShowEmptyTable="true" EmptyTableRowText="<%$ resources: grdStages.EmptyTableRowText %>"
    OnRowDataBound="grdStages_RowDataBound" OnRowCommand="grdStages_RowCommand" OnRowEditing="grdStages_RowEditing" OnRowDeleting="grdStages_RowDeleting"
    DataKeyNames="Id" EnableViewState="false" ExpandableRows="false" ResizableColumns="true" OnSorting="grdStages_Sorting" CurrentSortExpression="NeededDate" CurrentSortDirection="Ascending" AllowSorting="true">
    <Columns>
        <asp:BoundField ReadOnly="True" DataField="Description" HeaderText="<%$ resources: grdStages.Description.ColumnHeading %>" SortExpression="Description" />
        <asp:BoundField ReadOnly="True" DataField="Status" HeaderText="<%$ resources: grdStages.Status.ColumnHeading %>" SortExpression="Status" />
        <asp:BoundField ReadOnly="True" DataField="Priority" HeaderText="<%$ resources: grdStages.Priority.ColumnHeading %>" SortExpression="Priority" />
        <asp:TemplateField HeaderText="<%$ resources: grdStages.NeededDate.ColumnHeading %>" SortExpression="NeededDate">
            <ItemTemplate>
                <SalesLogix:DateTimePicker runat="server" ID="dtpNeededDate" Enabled="true" DisplayDate="true" DisplayTime="false" Timeless="True"
                    DisplayMode="AsText" AutoPostBack="false">
                </SalesLogix:DateTimePicker>
            </ItemTemplate>   
        </asp:TemplateField>
        <asp:TemplateField HeaderText="<%$ resources: grdStages.PercentComplete.ColumnHeading %>" SortExpression="PercentComplete">
            <ItemTemplate>
            <asp:Label ID="lblPercent" runat="server"></asp:Label>                    
            </ItemTemplate>
            </asp:TemplateField>
        <asp:ButtonField CommandName="AddTask" Text="<%$ resources: grdStages.AddTask.RowCommand %>" /> 
        <asp:ButtonField CommandName="Edit" Text="<%$ resources: grdStages.EditStage.RowCommand %>" /> 
        <asp:ButtonField CommandName="Complete" Text="<%$ resources: grdStages.CompleteStage.RowCommand %>" /> 
        <asp:ButtonField CommandName="Delete" Text="<%$ resources: grdStages.DeleteStage.RowCommand %>" /> 
    </Columns>
</SalesLogix:SlxGridView>