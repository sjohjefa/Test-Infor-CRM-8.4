<%@ Control Language="C#" AutoEventWireup="true" CodeFile="SpeedSearch.ascx.cs" Inherits="SmartParts_SpeedSearch" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>
<script type="text/javascript">
</script>

<div style="display:none">
    <asp:Panel ID="SpeedSearch_RTools" runat="server">
        <SalesLogix:PageLink ID="SpeedSearchHelpLink" runat="server" LinkType="HelpFileName" ToolTip="<%$ resources: Portal, Help_ToolTip %>" Target="Help" NavigateUrl="speedsearch.aspx" ImageUrl="~/images/icons/Help_16x16.png"></SalesLogix:PageLink></asp:Panel>
</div>

<div style="padding:10px 0 10px 10px">
    <asp:HiddenField ID="CurrentPageIndex" runat="server"/>
    <asp:HiddenField ID="TotalCount" runat="server"/>
    <asp:Label ID="RequestLabel" Style="z-index: 101" runat="server" CssClass="slxlabel" Text="Keywords:" meta:resourcekey="SpeedSearch_Label_Keywords"></asp:Label>
    <asp:TextBox ID="SearchRequest" Style="z-index: 102" runat="server" CssClass="slxtext" Width="76%" onkeydown="javascript:HandleEnterKeyEvent(event)"></asp:TextBox>
    <asp:HyperLink ID="btnAdvanced" runat="server" Text="Advanced" NavigateUrl="javascript:ToggleAdvanced()" style="padding-left:5px;padding-right:5px;" meta:resourcekey="SpeedSearch_href_Advanced"></asp:HyperLink>     
    <asp:Button ID="SearchButton" Style="z-index: 103; left: 16px; 
         top: 108px" runat="server" Text="Search" CssClass="slxbutton" 
         OnClick="SearchButton_Click" meta:resourcekey="SpeedSearch_Button_Search" UseSubmitBehavior="true"></asp:Button>
</div>
<div id="Advanced" style="display:none;min-width:890px;" >
    <div style="width:25%;padding:10px; float:left;">
        <div class="Clear">
            <asp:Label ID="lblSearchMethod" Style="z-index: 101" runat="server" CssClass="slxlabel" Text="Search Method" meta:resourcekey="SpeedSearch_Label_SearchMethod"></asp:Label>
            </div>
        <div class="Clear">
        <asp:DropDownList ID="SearchType" data-dojo-type="Sage.UI.Controls.Select" CssClass="select-control" shouldPublishMarkDirty="false" Style="z-index: 108" runat="server" Width="100%">
         <asp:ListItem Value="allwords" Selected="True" Text="Match on all words (AND)" meta:resourcekey="SpeedSearch_ListItem_SearchType_And"></asp:ListItem>
         <asp:ListItem Value="anywords" Text="Match on any word (OR)" meta:resourcekey="SpeedSearch_ListItem_SearchType_Or"></asp:ListItem>
         <asp:ListItem Value="phrase" Text="Match the exact phrase" meta:resourcekey="SpeedSearch_ListItem_SearchType_Phrase"></asp:ListItem>
         <asp:ListItem Value="bool" Text="Boolean (AND, OR, NOT)" meta:resourcekey="SpeedSearch_ListItem_SearchType_Bool"></asp:ListItem>
         <asp:ListItem Value="bool" Text="Natural Language" meta:resourcekey="SpeedSearch_ListItem_SearchType_Natural"></asp:ListItem>
        </asp:DropDownList>
        </div>
        <div class="Clear">
            <asp:CheckBoxList ID="SearchFlags" runat="server" CssClass="speedSearchSearchFlags inforCheckboxList">
                <asp:ListItem Selected="True" Text="Root" meta:resourcekey="SpeedSearch_ListItem_SearchFlags_Root"></asp:ListItem>
                <asp:ListItem Text="Thesaurus" meta:resourcekey="SpeedSearch_ListItem_SearchFlags_Thes"></asp:ListItem>
                <asp:ListItem Text="Sounds Like" meta:resourcekey="SpeedSearch_ListItem_SearchFlags_Sounds"></asp:ListItem>
            </asp:CheckBoxList>
        </div>
        <div class="Clear" style="padding-top:5px;">
            <asp:Label ID="lblMaxResults" runat="server" CssClass="slxlabel" Text="Maximum Results:" meta:resourcekey="SpeedSearch_Label_MaxResults"></asp:Label>
            <asp:DropDownList ID="MaxResults" data-dojo-type="Sage.UI.Controls.Select" CssClass="select-control" shouldPublishMarkDirty="false" runat="server">
                <asp:ListItem Text="Top 25" Value="25" Selected="True" meta:resourcekey="SpeedSearch_ListItem_MaxResults_25"></asp:ListItem>
                <asp:ListItem Text="Top 100" Value="100" meta:resourcekey="SpeedSearch_ListItem_MaxResults_100"></asp:ListItem>
                <asp:ListItem Text="Top 500" Value="500" meta:resourcekey="SpeedSearch_ListItem_MaxResults_500"></asp:ListItem>
                <asp:ListItem Text="All" Value="-1" meta:resourcekey="SpeedSearch_ListItem_MaxResults_All"></asp:ListItem>
            </asp:DropDownList>
        </div>
    </div>
    <div class="" style="width:25%;padding:10px; float:left;">
        <div class="Clear">
            <asp:Label ID="lblLookIn" Style="z-index: 101" runat="server" CssClass="slxlabel" Text="Look In" meta:resourcekey="SpeedSearch_Label_Lookin"></asp:Label>
           </div>
        <div class="Clear">
            <asp:PlaceHolder ID="PlaceHolder1" runat="server"></asp:PlaceHolder>
        </div>
    </div>
    <div class="" style="width:40%;padding:10px; float:left;">
        <div class="Clear">
            <asp:Label ID="lblFilterBy" Style="z-index: 101" runat="server" CssClass="slxlabel" Text="Filter by" meta:resourcekey="SpeedSearch_Label_FilterBy"></asp:Label>
            </div>
        <div class="Clear">
            <asp:PlaceHolder ID="PlaceHolder2" runat="server"></asp:PlaceHolder>
        </div>
    </div>
</div>
<div>
      <asp:Label ID="StatusLabel" runat="server" CssClass="slxlabel" Height="18px" Style="z-index: 101; left: 19px; top: 143px" Visible="False" Width="418px"></asp:Label>
</div>         
<div class="Clear" style="margin-top:10px; margin-bottom:10px">
    <asp:Label ID="PagingLabel" runat="server"></asp:Label>&nbsp;
    <asp:ImageButton ID="FirstPage" runat="server" AlternateText="First Page" ToolTip="First Page" ImageUrl="../../images/icons/Start_16x16.gif" OnClick="SearchResultsGrid_PageIndexChanged" ImageAlign="Middle" Visible="false" meta:resourcekey="SpeedSearch_Paging_Button_First" />
    <asp:ImageButton ID="PreviousPage" runat="server" AlternateText="Previous Page" ToolTip="Previous Page" ImageUrl="../../images/icons/Browse_Previous_16x16.gif" OnClick="SearchResultsGrid_PageIndexChanged" ImageAlign="Middle" Visible="false" meta:resourcekey="SpeedSearch_Paging_Button_Prev" />
    <asp:ImageButton ID="NextPage" runat="server" AlternateText="Next Page" ToolTip="Next Page" ImageUrl="../../images/icons/Browse_Next_16x16.gif" OnClick="SearchResultsGrid_PageIndexChanged" ImageAlign="Middle" Visible="false" meta:resourcekey="SpeedSearch_Paging_Button_Next" />
    <asp:ImageButton ID="LastPage" runat="server" AlternateText="Last Page" ToolTip="Last Page" ImageUrl="../../images/icons/End_16x16.gif" OnClick="SearchResultsGrid_PageIndexChanged" ImageAlign="Middle" Visible="false" meta:resourcekey="SpeedSearch_Paging_Button_Last" />
</div>

<div style="overflow:auto">
      <asp:DataGrid ID="SearchResultsGrid" CssClass="nodojoTable" Style="z-index: 104; left: 16px; 
         top: 140px" runat="server" AllowCustomPaging="True" AllowSorting="True" 
         AutoGenerateColumns="False" Font-Size="11px" Font-Names="Arial"  CellPadding="3" OnPageIndexChanged="SearchResultsGrid_PageIndexChanged" >
         <%--<FooterStyle ForeColor="Black" BackColor="#CCCCCC"></FooterStyle>--%>
         <%--<SelectedItemStyle Font-Bold="True" ForeColor="White" BackColor="#008A8C"></SelectedItemStyle>--%>
         <AlternatingItemStyle ForeColor="Black" BackColor="#F8F8F8"></AlternatingItemStyle>
         <ItemStyle BackColor="Transparent"></ItemStyle>
         <HeaderStyle CssClass="nodojoTableHeader"></HeaderStyle>
         <Columns>
            <asp:BoundColumn DataField="Source" SortExpression="Source" ReadOnly="True" meta:resourcekey="SpeedSearch_Grid_Header_Source" HeaderText="Source">
               <ItemStyle HorizontalAlign="Left" VerticalAlign="Top"></ItemStyle>
            </asp:BoundColumn>
            <asp:TemplateColumn SortExpression="Name" meta:resourcekey="SpeedSearch_Grid_Header_Document" HeaderText="Document">
               <ItemTemplate>
                  <font style="font-weight: bold;">
                     <asp:HyperLink ID="HyperLink1" runat="server" Target="_top" NavigateUrl='<%# DataBinder.Eval(Container.DataItem, "HighlightLink") %>'>
									<%# DataBinder.Eval(Container.DataItem, "DisplayName") %>
                     </asp:HyperLink></font><br><font style="font-size: x-small;">
                     <asp:HyperLink ID="HyperLink3" runat="server" Target="_top" NavigateUrl='<%# DataBinder.Eval(Container.DataItem, "RelationLink1") %>'>
									<%# DataBinder.Eval(Container.DataItem, "RelationName1") %>
                     </asp:HyperLink>&nbsp;&nbsp;<asp:HyperLink ID="HyperLink4" runat="server" Target="_top" NavigateUrl='<%# DataBinder.Eval(Container.DataItem, "RelationLink2") %>'>
									<%# DataBinder.Eval(Container.DataItem, "RelationName2") %>
                     </asp:HyperLink>&nbsp;&nbsp;<asp:HyperLink ID="HyperLink5" runat="server" Target="_top" NavigateUrl='<%# DataBinder.Eval(Container.DataItem, "RelationLink3") %>'>
									<%# DataBinder.Eval(Container.DataItem, "RelationName3") %>
                     </asp:HyperLink>&nbsp;&nbsp;<asp:HyperLink ID="HyperLink6" runat="server" Target="_top" NavigateUrl='<%# DataBinder.Eval(Container.DataItem, "RelationLink4") %>'>
									<%# DataBinder.Eval(Container.DataItem, "RelationName4") %>
                     </asp:HyperLink></font><br>
                  <div id="SynopsisPane<%# HttpUtility.HtmlEncode(DataBinder.Eval(Container.DataItem, "DisplayName")) %>">
                  <%# DataBinder.Eval(Container.DataItem, "Synopsis") %>
                  <font color="green" style="font-size: x-small;">
                     <asp:HyperLink ID="Hyperlink2" runat="server" Target="_doc" NavigateUrl='<%# DataBinder.Eval(Container.DataItem, "DirectLink") %>'>
									<%# DataBinder.Eval(Container.DataItem, "DirectLink") %>
                     </asp:HyperLink>
                     <%# DataBinder.Eval(Container.DataItem, "Size") %>
                     k
                     <%# DataBinder.Eval(Container.DataItem, "Date") %>
                     ,
                     <%# DataBinder.Eval(Container.DataItem, "HitCount") %>
                     hit(s)</font><br>
                  </div>
                  <a href="javascript:GetPreviewDoc('<%# DataBinder.Eval(Container, "ItemIndex") %>', '<%# DataBinder.Eval(Container.DataItem, "AllowPreview") %>')" style="color:red" id="lblPreview"><%= GetLocalResourceObject("SpeedSearch_Preview_Link") %></a>
                  <%--<label id="lblPreview" style="cursor: hand; color: red; text-decoration: underline; float:left" onclick="GetPreviewDoc('<%# DataBinder.Eval(Container, "ItemIndex") %>', '<%# DataBinder.Eval(Container.DataItem, "AllowPreview") %>')" ><%= GetLocalResourceObject("SpeedSearch_Preview_Link") %></label>--%>
                  <label id="lblReturnResult" style="cursor: pointer; color: red; text-decoration: underline; float:left; margin-left:10px; display:<%# DataBinder.Eval(Container.DataItem, "DisplayReturnResult") %>" onclick="ReturnResult('<%# DataBinder.Eval(Container, "ItemIndex") %>')" ><%= GetLocalResourceObject("SpeedSearch_ReturnResult_Link") %></label>
               </ItemTemplate>
               <FooterStyle HorizontalAlign="Left" VerticalAlign="Top"></FooterStyle>
            </asp:TemplateColumn>
         </Columns>
         <PagerStyle HorizontalAlign="Center" ForeColor="Navy" BackColor="#999999" Mode="NumericPages" Position="TopAndBottom" Font-Bold="True" Font-Italic="False" Font-Overline="False" Font-Strikeout="False" Font-Underline="False">
         </PagerStyle>
      </asp:DataGrid>
</div>
<asp:HiddenField runat="server" ID="currentIndex" />
<asp:HiddenField ID="MarkUsedInfo" runat="server" />
<asp:HiddenField ID="ReturnResultAction" runat="server" />
<asp:Button runat="server" ID="btnReturnResult" style="display:none" />
<div>
    <asp:UpdatePanel ID="SearchDocumentPanel" runat="server" >
    <ContentTemplate>
<asp:Button runat="server" ID="HiddenField0" style="display:none" />
<asp:Button runat="server" ID="HiddenField1" style="display:none"/>
<asp:Button runat="server" ID="HiddenField2" style="display:none"/>
<asp:Button runat="server" ID="HiddenField3" style="display:none"/>
<asp:Button runat="server" ID="HiddenField4" style="display:none"/>
<asp:Button runat="server" ID="HiddenField5" style="display:none"/>
<asp:Button runat="server" ID="HiddenField6" style="display:none"/>
<asp:Button runat="server" ID="HiddenField7" style="display:none"/>
<asp:Button runat="server" ID="HiddenField8" style="display:none"/>
<asp:Button runat="server" ID="HiddenField9" style="display:none"/>
    </ContentTemplate>
    </asp:UpdatePanel>
</div>
