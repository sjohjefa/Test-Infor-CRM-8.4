<%@ Control Language="C#" AutoEventWireup="true" CodeFile="StepGroupActions.ascx.cs" Inherits="StepGroupActions" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>

<table border="0" cellpadding="1" cellspacing="0" class="formtable">
    <col width="1%" /><col width="50%" /><col width="49%" />
    <tr>
        <td colspan="4">
            <span class="slxlabel">
                <asp:Label ID="lblHeader" runat="server" Text="<%$ resources:lblHeader.Caption %>"></asp:Label>
            </span>
            <br />
            <br />
        </td>
    </tr>
    <tr>
        <td></td>
        <td colspan="2">
            <span class="slxlabel">
                <asp:Label ID="lblSubHeader" runat="server" Text="<%$ resources:lblSubHeader.Caption %>"></asp:Label>
            </span>
        </td>
    </tr>
    <tr>
        <td></td>
        <td colspan="2">
            <SalesLogix:SlxGridView runat="server" ID="grdActions" GridLines="Both" AutoGenerateColumns="false" CellPadding="4" CssClass="datagrid" 
                PagerStyle-CssClass="gridPager" AlternatingRowStyle-CssClass="rowdk" RowStyle-CssClass="rowlt" ShowEmptyTable="true" Width="100%" 
                EnableViewState="false" AllowSorting="false" ExpandableRows="False" ResizableColumns="false" OnRowCommand="grdActions_OnRowCommand"
                EmptyTableRowText="<%$ resources: grdActions.EmptyTableText %>" OnRowEditing="grdActions_OnRowEditing" UseSLXPagerTemplate="false" 
                DataKeyNames="Name" AllowPaging="false">
                <Columns>
                    <asp:BoundField DataField="Name" Visible="false" />
                    <asp:TemplateField ItemStyle-Width="200px" ItemStyle-HorizontalAlign="Left" HeaderText="<%$ resources: grdActions.Name.ColumnHeading %>">
                        <ItemTemplate>
                            <asp:Label ID="lblActionDisplayName" runat="server" Font-Bold="<%# IsActionDefined(Container.DataItem)%>"
                                Text='<%# DataBinder.Eval(Container.DataItem, "DisplayName") %>'/>
                        </ItemTemplate>
                        </asp:TemplateField>
                    <asp:ButtonField ButtonType="Button" ItemStyle-Width="100px" CommandName="Edit" Text="<%$ resources: grdActions.Define.Column %>"
                        ItemStyle-HorizontalAlign="Center" >
                    <ControlStyle CssClass="slxbutton" />
                    </asp:ButtonField>
                    <asp:TemplateField ItemStyle-Width="25px" ItemStyle-VerticalAlign="Middle" ItemStyle-HorizontalAlign="Center"
                        HeaderText="<%$ resources: grdActions.IsActive.ColumnHeading %>">
                        <ItemTemplate>
                                <%# CreatePropertyCheckBox(Container.DataItem)%>
                        </ItemTemplate>
                    </asp:TemplateField>
                </Columns>
            </SalesLogix:SlxGridView>
        </td>
    </tr>
</table>