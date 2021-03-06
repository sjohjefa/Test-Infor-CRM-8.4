using System;
using System.IO;
using System.Text;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using Sage.Entity.Interfaces;
using Sage.Platform.Application;
using Sage.Platform.Application.UI;
using Sage.Platform.WebPortal.Services;
using Sage.Platform.WebPortal.SmartParts;
using Sage.SalesLogix.Services.Import;

public partial class ImportLeadsWizard : EntityBoundSmartPartInfoProvider
{
    #region Public Methods

    /// <summary>
    /// Gets the type of the entity.
    /// </summary>
    /// <value>The type of the entity.</value>
    public override Type EntityType
    {
        get { return typeof(ILead); }
    }

    /// <summary>
    /// Gets or sets the entity context.
    /// </summary>
    /// <value>The entity context.</value>
    /// <returns>The specified <see cref="T:System.Web.HttpContext"></see> object associated with the current request.</returns>
    [ServiceDependency]
    public IContextService ContextService { get; set; }

    /// <summary>
    /// Gets the smart part info.
    /// </summary>
    /// <param name="smartPartInfoType">Type of the smart part info.</param>
    /// <returns></returns>
    public override ISmartPartInfo GetSmartPartInfo(Type smartPartInfoType)
    {
        ToolsSmartPartInfo tinfo = new ToolsSmartPartInfo();
        ImportManager importManager = Page.Session["importManager"] as ImportManager;
        if (importManager != null)
        {
            tinfo.Title = String.Format(GetLocalResourceObject("dialog_StepSelectFile_Title").ToString(), Path.GetFileName(importManager.SourceFileName));
            tinfo.Description = importManager.SourceFileName;
        }
        foreach (Control c in pnlImportLead_RTools.Controls)
        {
            tinfo.RightTools.Add(c);
        }
        return tinfo;
    }

    #endregion

    /// <summary>
    /// Adds the DialogService for each of the wizards steps.
    /// </summary>
    /// <param name="sender">The sender.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void AddDialogServiceToPage(object sender, EventArgs e)
    {
        frmSelectFile.DialogService = DialogService;
        frmSelectFile.ContextService = ContextService;
        frmSelectFile.DialogService.onDialogClosing += OnStepClosing;
        frmDefineDelimiter.DialogService = DialogService;
        frmDefineDelimiter.DialogService.onDialogClosing += OnStepClosing;
        frmMapFields.DialogService = DialogService;
        frmMapFields.ContextService = ContextService;
        frmMapFields.DialogService.onDialogClosing += OnStepClosing;
        frmManageDuplicates.DialogService = DialogService;
        frmManageDuplicates.ContextService = ContextService;
        frmManageDuplicates.DialogService.onDialogClosing += OnStepClosing;
        frmGroupActions.DialogService = DialogService;
        frmGroupActions.ContextService = ContextService;
        frmGroupActions.DialogService.onDialogClosing += OnStepClosing;
        frmReview.DialogService = DialogService;
        frmReview.ContextService = ContextService;
        frmReview.DialogService.onDialogClosing += OnStepClosing;
    }

    public void OnStepClosing(object from, WebDialogClosingEventArgs e)
    {
        IPanelRefreshService refresher = PageWorkItem.Services.Get<IPanelRefreshService>(true);
        refresher.RefreshAll();
    }

    /// <summary>
    /// Raises the <see cref="E:PreRender"/> event.
    /// </summary>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected override void OnPreRender(EventArgs e)
    {
        foreach (WizardStep step in wzdImportLeads.WizardSteps)
        {
            SetStep(step);
        }
        Button startButton = wzdImportLeads.FindControl("StartNavigationTemplateContainerID").FindControl("cmdStartButton") as Button;
        ScriptManager.GetCurrent(Page).RegisterPostBackControl(startButton);
        Button cmdStartProcess = wzdImportLeads.FindControl("FinishNavigationTemplateContainerID").FindControl("cmdStartProcess") as Button;
        Button cmdStartImportProcess = frmReview.FindControl("cmdStartImportProcess") as Button;
        cmdStartProcess.Attributes.Add("onclick", String.Format("javascript: importLeadsWizard.showImportProcess('{0}')", cmdStartImportProcess.ClientID));
    }

    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        if (Visible)
        {
            RegisterClientScript();
        }
    }

    protected void RegisterClientScript()
    {
        var script = new StringBuilder();
        script.AppendLine("require(['Sage/MainView/Lead/ImportLeadsWizard', 'dojo/ready'],");
        script.AppendLine(" function(importLeadsWizard, dojoReady) {");
        script.AppendLine("     dojoReady(function() {if(!window.importLeadsWizard){ window.importLeadsWizard = new Sage.MainView.Lead.ImportLeadsWizard();}");
        script.AppendLine("     });");
        script.AppendLine(" });");
        ScriptManager.RegisterStartupScript(Page, GetType(), "ImportLeadsWizard", script.ToString(), true);
    }

    /// <summary>
    /// Handles the Click event of the startButton control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void startButton_Click(object sender, EventArgs e)
    {
        ImportManager importManager = Page.Session["importManager"] as ImportManager;
        if (importManager != null)
            importProcessId.Value = importManager.ToString();
        frmSelectFile.UploadFile();
    }

    /// <summary>
    /// Override this method to add bindings to the currently bound smart part
    /// </summary>
    protected override void OnAddEntityBindings()
    {
    }

    /// <summary>
    /// Called when the dialog is closing.
    /// </summary>
    protected override void OnClosing()
    {
        Page.Session.Remove("importManager");
        if (DialogService.DialogParameters.ContainsKey("IsImportWizard"))
            DialogService.DialogParameters.Remove("IsImportWizard");
        base.OnClosing();
    }

    /// <summary>
    /// Handles the NextButtonClick event of the wzdImportLeads control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.Web.UI.WebControls.WizardNavigationEventArgs"/> instance containing the event data.</param>
    protected void wzdImportLeads_NextButtonClick(object sender, WizardNavigationEventArgs e)
    {
        switch (wzdImportLeads.ActiveStepIndex)
        {
            case 0:
                PerformSelectFileActions();
                break;
            case 1:
                PerformDefineDelimiterActions();
                break;
            case 2:
                PerformMapFieldsActions();
                break;
            case 3:
                PerformManageDuplicatesActions();
                break;
            case 4:
                PerformGroupActions();
                break;
            case 5:
                PerformPreviewActions();
                break;
        }
    }

    protected void wzdImportLeads_PreviousButtonClick(object sender, WizardNavigationEventArgs e)
    {
        switch (wzdImportLeads.ActiveStepIndex)
        {
            case 0:
                break;
            case 1:
                break;
            case 2:
                break;
            case 3:
                PreviousManageDuplicatesActions();
                break;
            case 4:
                break;
            case 5:
                break;
        }
    }

    /// <summary>
    /// Handles the CancelButtonClick event of the wzdImportLeads control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void wzdImportLeads_CancelButtonClick(object sender, EventArgs e)
    {
    }

    /// <summary>
    /// Called when the wizards submits the request to start the import process.
    /// </summary>
    /// <param name="sender">The sender.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void StartImportProcess_Click(object sender, EventArgs e)
    {
        frmManageDuplicates.AssignMatchFilters();
        ImportManager importManager = Page.Session["importManager"] as ImportManager;
        if (importManager != null)
        {
            Page.Session["importManager"] = importManager;
            Button cmdStartImportProcess = wzdImportLeads.FindControl("FinishNavigationTemplateContainerID").FindControl("cmdStartProcess") as Button;
            cmdStartImportProcess.Visible = false;
            Button btnBackButton = wzdImportLeads.FindControl("FinishNavigationTemplateContainerID").FindControl("btnBack") as Button;
            btnBackButton.Visible = false;
            frmReview.StartImportProcess();
        }
    }

    /// <summary>
    /// Handles the ActiveStepChanged event of the wzdImportLeads control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void wzdImportLeads_ActiveStepChanged(object sender, EventArgs e)
    {
        if (!frmSelectFile.ValidateRequiredFields())
            wzdImportLeads.ActiveStepIndex = 0;
    }

    /// <summary>
    /// Sets the step.
    /// </summary>
    /// <param name="step">The step.</param>
    protected void SetStep(WizardStep step)
    {
        if (step == null) return;
        switch (step.ID)
        {
            case "cmdSelectFile":
                SetStepControls(lblStep1Name, divStep1, step, !String.IsNullOrEmpty(visitedStep1.Value));
                break;
            case "cmdDefineDelimiter":
                SetStepControls(lblStep2Name, divStep2, step, !String.IsNullOrEmpty(visitedStep2.Value));
                break;
            case "cmdMapFields":
                SetStepControls(lblStep3Name, divStep3, step, !String.IsNullOrEmpty(visitedStep3.Value));
                break;
            case "cmdManageDuplicates":
                SetStepControls(lblStep4Name, divStep4, step, !String.IsNullOrEmpty(visitedStep4.Value));
                break;
            case "cmdGroupActions":
                SetStepControls(lblStep5Name, divStep5, step, !String.IsNullOrEmpty(visitedStep5.Value));
                break;
            case "cmdReview":
                SetStepControls(lblStep6Name, divStep6, step, !String.IsNullOrEmpty(visitedStep6.Value));
                break;
        }
    }

    #region Private Methods

    /// <summary>
    /// Performs the select file actions.
    /// </summary>
    private void PerformSelectFileActions()
    {
        visitedStep1.Value = "True";
        frmSelectFile.SetProcessIDState(importProcessId.Value);
        frmSelectFile.SetStepSelectFileOptions();
    }

    /// <summary>
    /// Performs the define delimiter actions.
    /// </summary>
    private void PerformDefineDelimiterActions()
    {
        visitedStep2.Value = "True";
    }

    /// <summary>
    /// Performs the map fields actions.
    /// </summary>
    private void PerformMapFieldsActions()
    {
        visitedStep3.Value = "True";
    }

    /// <summary>
    /// Performs the manage duplicates actions.
    /// </summary>
    private void PerformManageDuplicatesActions()
    {
        visitedStep4.Value = "True";
        frmManageDuplicates.AssignMatchFilters();
    }

    /// <summary>
    /// Previouses the manage duplicates actions.
    /// </summary>
    private void PreviousManageDuplicatesActions()
    {
        frmManageDuplicates.AssignMatchFilters();
    }

    /// <summary>
    /// Saves options to import manager to be viewed in the preview
    /// </summary>
    private void PerformGroupActions()
    {
        visitedStep5.Value = "True";
        visitedStep6.Value = "True";
        frmGroupActions.SaveActionsState();
    }

    /// <summary>
    /// Performs the preview actions.
    /// </summary>
    private void PerformPreviewActions()
    {
        visitedStep6.Value = "True";
    }

    /// <summary>
    /// Sets the step contorls.
    /// </summary>
    /// <param name="lblStepName">Name of the LBL step.</param>
    /// <param name="divStep">The div step.</param>
    /// <param name="step">The step.</param>
    /// <param name="visited">if set to <c>true</c> [visited].</param>
    private void SetStepControls(Label lblStepName, HtmlControl divStep, WizardStep step, bool visited)
    {
        if (lblStepName != null)
        {
            lblStepName.Text = step.Title;
            if (wzdImportLeads.ActiveStep.ID == step.ID)
            {
                lblStepName.CssClass = "lblWizardActive";
                lblStepName.Enabled = true;
            }
            else
            {
                if (visited)
                {
                    lblStepName.CssClass = "lblWizardVisited";
                    lblStepName.Enabled = true;
                }
                else
                {
                    lblStepName.Enabled = false;
                    lblStepName.CssClass = "lblWizardNotVisited";
                }
            }
        }

        if (divStep == null) return;
        if (wzdImportLeads.ActiveStep.ID == step.ID)
        {
            divStep.Attributes.Add("class", "wizardActive");
        }
        else
        {
            divStep.Attributes.Add("class", visited ? "wizardVisited" : "wizardNotVisited");
        }
    }

    #endregion
}