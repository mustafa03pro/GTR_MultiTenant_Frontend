import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router-dom'
import './App.css'
import { TenantProvider } from './context/TenantContext.jsx'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import HrDashboard from './pages/HrDashboard'
import Employee from './pages/Employee'
import MasterAdmin from './pages/MasterAdmin'
import EmployeeDashboard from './pages/EmployeeDashboard'
import UsersDetails from './pages/UsersDetails'
// import Settings from './pages/Settings'
import Settings from './company/Settings.jsx'
import HrmsSettings from './company/HrmsSettings.jsx';
import ReportsLayout from './pages/hrmsReport/ReportsLayout.jsx';
import EmployeeReports from './pages/hrmsReport/EmployeeReports.jsx';
import MasterEmployeeReport from './pages/hrmsReport/MasterEmployeeReport.jsx';
import SummaryReportView from './pages/hrmsReport/SummaryReportView.jsx';
import HeadCount from './pages/hrmsReport/HeadCount.jsx';
import Demographics from './pages/hrmsReport/Demographics.jsx';
import EmploymentStatus from './pages/hrmsReport/EmploymentStatus.jsx';
import EmployeeDocumentsReport from './pages/hrmsReport/EmployeeDocumentsReport.jsx';
import Attendance from './pages/Attendance'
import AttendanceReports from './pages/hrmsReport/Attendance/AttendanceReports.jsx';
import DailyAttendanceReport from './pages/hrmsReport/Attendance/DailyAttendanceReport.jsx';
import MonthlyAttendanceReport from './pages/hrmsReport/Attendance/MonthlyAttendanceReport.jsx';
import OvertimeReport from './pages/hrmsReport/Attendance/OvertimeReport.jsx';
import ComplianceReport from './pages/hrmsReport/Attendance/ComplianceReport.jsx';
import LeaveReports from './pages/hrmsReport/Leave/LeaveReports.jsx';
import LeaveAccrualReport from './pages/hrmsReport/Leave/LeaveAccrualReport.jsx';
import PayrollReports from './pages/hrmsReport/Payroll/PayrollReports.jsx';
import PayrollRegisterReport from './pages/hrmsReport/Payroll/PayrollRegisterReport.jsx';
import WpsSifReport from './pages/hrmsReport/Payroll/WpsSifReport.jsx';
import WpsComplianceReport from './pages/hrmsReport/Payroll/WpsComplianceReport.jsx';
import ComplianceReports from './pages/hrmsReport/Compliance/ComplianceReports.jsx';
import LaborCardReport from './pages/hrmsReport/Compliance/LaborCardReport.jsx';
import CompanyQuotaReport from './pages/hrmsReport/Compliance/CompanyQuotaReport.jsx';
import NationalityReport from './pages/hrmsReport/Compliance/NationalityReport.jsx';
import EmiratizationReport from './pages/hrmsReport/Compliance/EmiratizationReport.jsx';
import AbscondingReport from './pages/hrmsReport/Compliance/AbscondingReport.jsx';
import EndOfServiceReports from './pages/hrmsReport/EndOfService/EndOfServiceReports.jsx';
import EosbCalculationReport from './pages/hrmsReport/EndOfService/EosbCalculationReport.jsx';
import FinalSettlementReport from './pages/hrmsReport/EndOfService/FinalSettlementReport.jsx';
import TerminationReasonReport from './pages/hrmsReport/EndOfService/TerminationReasonReport.jsx';
import PayrollManagement from './pages/PayrollManagement'
import PosDashboard from './pos/page/PosDashboard'
import ProductScanResult from './pos/page/ProductScanResult'
import CompanyDashboard from './pages/CompanyDashboard'
import LeaveManagement from './pages/LeaveManagement.jsx'
import ProductionSettings from './production/settings/ProductionSettings.jsx'
import CrmSettings from './crm/settings/CrmSettings.jsx'
import Production from './production/pages/Production.jsx'
import ManufacturingOrder from './production/pages/ManufacturingOrder.jsx'
import ManufacturingOrderForm from './production/pages/ManufacturingOrderForm.jsx'
import ViewManufacturingOrder from './production/pages/ViewManufacturingOrder.jsx'
import ProFinishedGoodForm from './production/pages/ProFinishedGoodForm.jsx'
import ProcessFinishedGood from './production/pages/ProcessFinishedGood.jsx'
import BomFinishedGood from './production/pages/BomFinishedGood.jsx'
import CrmModule from './crm/pages/CrmModule.jsx'
import CrmLead from './crm/pages/CrmLead.jsx'
import CrmCompanies from './crm/pages/CrmCompanies.jsx'
import LeadInfo from './crm/pages/Leadinfo.jsx';
import PurchaseModule from './purchase/pages/PurchaseModule.jsx';
import SalesLayout from './sales/SalesLayout.jsx'
import SalesDashboard from './sales/SalesDashboard.jsx';
import Orders from './sales/pages/Orders.jsx';
import OrderForm from './sales/pages/OrderForm.jsx';
import QuotationForm from './sales/pages/QuotationForm.jsx';
import Quotation from './sales/pages/Quotation.jsx'
import ViewQuotation from './sales/pages/ViewQuotation.jsx';
import ViewSales from './sales/pages/ViewSales.jsx';
import RentalQuotation from './sales/pages/RentalQuotation.jsx';
import RentalQuotationForm from './sales/pages/RentalQuotationForm.jsx';
import RentalSalesOrder from './sales/pages/RentalSalesOrder.jsx';
import RentalSalesOrderForm from './sales/pages/RentalSalesOrderForm.jsx';
import RentalSalesOrderView from './sales/pages/RentalSalesOrderView.jsx';
import RentalItemRecieved from './sales/pages/RentalItemRecieved.jsx';
import RentalItemRecievedForm from './sales/pages/RentalItemRecievedForm.jsx';
import RentalItemRecievedView from './sales/pages/RentalItemRecievedView.jsx';
import RentalItemReceivedByOrder from './sales/pages/RentalItemReceivedByOrder.jsx';
import RecievedAmount from './sales/pages/RecievedAmount.jsx';
import RecievedAmountForm from './sales/pages/RecievedAmountForm.jsx';
import RecievedAmountView from './sales/pages/RecievedAmountView.jsx';
import CreditNotes from './sales/pages/CreditNotes.jsx';
import CreditNotesForm from './sales/pages/CreditNotesForm.jsx';
import CreditNotesView from './sales/pages/CreditNotesView.jsx';
import PosReportsLayout from './pos/page/reports/PosReportsLayout.jsx';
import BusinessSummary from './pos/page/reports/BusinessSummary.jsx';
import DailySummaryReport from './pos/page/reports/DailySummaryReport';
import TotalDailyReports from './pos/page/reports/TotalDailyReports';
import ClosingReport from './pos/page/reports/ClosingReport.jsx';
import SalesSupportReport from './pos/page/reports/SalesSupportReport.jsx';
import SalesPaymentReport from './pos/page/reports/SalesPaymentReport';
import UserTransfer from './pos/page/reports/UserTransfer';
import SalesSourceReport from './pos/page/reports/SalesSourceReport.jsx';
import TotalSalesReport from './pos/page/reports/TotalSalesReport.jsx';
import SalesStatusReport from './pos/page/reports/SalesStatusReport.jsx';
import DeliveryDriverReport from './pos/page/reports/DeliveryDriverReport.jsx';
import SalesForecastingReport from './pos/page/reports/SalesForecastingReport.jsx';
import PaymentChangeReport from './pos/page/reports/PaymentChangeReport.jsx';
import SalesDiscountReport from './pos/page/reports/SalesDiscountReport.jsx';
import CancellationReport from './pos/page/reports/CancellationReport.jsx';
import VoidReport from './pos/page/reports/VoidReport.jsx';
import ItemMovementReport from './pos/page/reports/ItemMovementReport.jsx';
import SlowSellingReport from './pos/page/reports/SlowSellingReport';
import BestSellingReport from './pos/page/reports/BestSellingReport.jsx';
import ItemSalesReport from './pos/page/reports/ItemSalesReport.jsx';
import DeliveryOrder from './sales/pages/DeliveryOrder.jsx';
import DeliveryOrderForm from './sales/pages/DeliveryOrderForm.jsx';
import DeliveryOrderView from './sales/pages/DeliveryOrderView.jsx';
import RentalQuotationView from './sales/pages/RentalQuotationView.jsx';
import ProformaInvoice from './sales/pages/ProformaInvoice.jsx';
import ProformaInvoiceForm from './sales/pages/ProformaInvoiceForm.jsx';
import ProformaInvoiceView from './sales/pages/ProformaInvoiceView.jsx';
import Invoice from './sales/pages/Invoice.jsx';
import InvoiceForm from './sales/pages/InvoiceForm.jsx';
import InvoiceView from './sales/pages/InvoiceView.jsx';
import RentalInvoice from './sales/pages/RentalInvoice.jsx';
import RentalInvoiceForm from './sales/pages/RentalInvoiceForm.jsx';
import RentalInvoiceView from './sales/pages/RentalInvoiceView.jsx';
import SalesSetting from './sales/pages/SalesSetting.jsx'
import PartyType from './components/PartyType/PartyType.jsx'
import PartyForm from './components/PartyType/PartyForm.jsx'
import CrmContacts from './crm/pages/CrmContacts.jsx'
import Account from './accounting/pages/Account.jsx'
import AccountSetting from './accounting/settings/AccountSetting.jsx'
import CrmSalesProduct from './crm/components/CrmSalesProduct.jsx'
import CrmSalesProductForm from './crm/components/CrmSalesProductForm.jsx'
import ProductionSchedule from './production/pages/ProductionSchedule.jsx'

// Placeholder for CRM child pages
const CrmPlaceholder = ({ pageName }) => (
  <div className="text-center py-20">
    <h1 className="text-3xl font-bold text-foreground">{pageName}</h1>
    <p className="text-foreground-muted mt-2">This page is under construction.</p>
  </div>
);

import CrmHome from './crm/pages/CrmHome.jsx';
// Placeholder for ACCOUNT child pages
const AccountPlaceholder = ({ pageName }) => (
  <div className="text-center py-20">
    <h1 className="text-3xl font-bold text-foreground">{pageName}</h1>
    <p className="text-foreground-muted mt-2">This page is under construction.</p>
  </div>
);

// Placeholder for PRODUCTION child pages
const ProductionPlaceholder = ({ pageName }) => (
  <div className="text-center py-20">
    <h1 className="text-3xl font-bold text-foreground">{pageName}</h1>
    <p className="text-foreground-muted mt-2">This page is under construction.</p>
  </div>
);

// Placeholder for PURCHASE child pages
const PurchasePlaceholder = ({ pageName }) => (
  <div className="text-center py-20">
    <h1 className="text-3xl font-bold text-foreground">{pageName}</h1>
    <p className="text-foreground-muted mt-2">This page is under construction.</p>
  </div>
);

function App() {
  return (
    <TenantProvider>
      <Router>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/hrdashboard' element={<HrDashboard />} />
          <Route path='/employees' element={<Employee />} />
          <Route path='/master-admin' element={<MasterAdmin />} />
          <Route path='/employee-dashboard' element={<EmployeeDashboard />} />
          <Route path="/users-details" element={<UsersDetails />} />
          <Route path='/attendance' element={<Attendance />} />
          <Route path='/leave' element={<LeaveManagement />} />
          <Route path='/payroll-management' element={<PayrollManagement />} />
          <Route path='/pos-dashboard' element={<PosDashboard />} />
          <Route path='/product-scan/:barcode' element={<ProductScanResult />} />
          <Route path='/pos-reports' element={<PosReportsLayout />}>
            <Route path='business-summary' element={<BusinessSummary />} />
            <Route path='daily-sales' element={<DailySummaryReport />} />
            <Route path='total-daily-sales' element={<TotalDailyReports />} />
            <Route path='closing' element={<ClosingReport />} />
            <Route path='sales-support' element={<SalesSupportReport />} />
            <Route path='sales-payment' element={<SalesPaymentReport />} />
            <Route path='user-transfer' element={<UserTransfer />} />
            <Route path='sales-source' element={<SalesSourceReport />} />
            <Route path='total-sales' element={<TotalSalesReport />} />
            <Route path='sales-status' element={<SalesStatusReport />} />
            <Route path='delivery-driver-report' element={<DeliveryDriverReport />} />
            <Route path='sales-forecasting-report' element={<SalesForecastingReport />} />
            <Route path='payment-change-report' element={<PaymentChangeReport />} />
            <Route path='sales-discount-report' element={<SalesDiscountReport />} />
            <Route path='cancellation-report' element={<CancellationReport />} />
            <Route path='void-report' element={<VoidReport />} />
            <Route path='item-movement-report' element={<ItemMovementReport />} />
            <Route path='slow-selling-report' element={<SlowSellingReport />} />
            <Route path='best-selling-report' element={<BestSellingReport />} />
            <Route path='item-sales-report' element={<ItemSalesReport />} />
            {/* Add other report routes here as they are created */}
          </Route>
          <Route path='/company-dashboard' element={<CompanyDashboard />} />
          <Route path='/reports' element={<ReportsLayout />}>
            <Route index element={<Navigate to="employee" replace />} />
            <Route path='employee' element={<EmployeeReports />}>
              <Route index element={<Navigate to="master" replace />} />
              <Route path='master' element={<MasterEmployeeReport />} />
              <Route path='count' element={<HeadCount />} />
              <Route path='demographics' element={<Demographics />} />
              <Route path='employment-status' element={<EmploymentStatus />} />
              <Route path='documents' element={<EmployeeDocumentsReport />} />
            </Route>
            <Route path='attendance' element={<AttendanceReports />}>
              <Route index element={<Navigate to="daily" replace />} />
              <Route path='daily' element={<DailyAttendanceReport />} />
              <Route path='monthly' element={<MonthlyAttendanceReport />} />
              <Route path='overtime' element={<OvertimeReport />} />
              <Route path='compliance' element={<ComplianceReport />} />
            </Route>
            <Route path='leave' element={<LeaveReports />}>
              <Route index element={<Navigate to="accrual" replace />} />
              <Route path='accrual' element={<LeaveAccrualReport />} />
            </Route>
            <Route path='payroll' element={<PayrollReports />}>
              <Route index element={<Navigate to="register" replace />} />
              <Route path='register' element={<PayrollRegisterReport />} />
              <Route path='wps-sif' element={<WpsSifReport />} />
              <Route path='compliance' element={<WpsComplianceReport />} />
            </Route>

           {/* Compliance Reports */}
            <Route path='compliance' element={<ComplianceReports />}>
              <Route index element={<Navigate to="labor-card" replace />} />
              <Route path='labor-card' element={<LaborCardReport />} />
              <Route path='company-quota' element={<CompanyQuotaReport />} />
              <Route path='nationality' element={<NationalityReport />} />
              <Route path='emiratization' element={<EmiratizationReport />} />
              <Route path='absconding' element={<AbscondingReport />} />
            </Route>

            {/* End of Service Reports */}
            <Route path='eos' element={<EndOfServiceReports />}>
              <Route index element={<Navigate to="eosb" replace />} />
              <Route path='eosb' element={<EosbCalculationReport />} />
              <Route path='final-settlement' element={<FinalSettlementReport />} />
              <Route path='termination-reason' element={<TerminationReasonReport />} />
            </Route>
          </Route>
      
          {/* Standalone HRMS Settings Route */}
          <Route path='/hrms-settings' element={<HrmsSettings />} />
          {/* Settings Hub Route */}
          <Route path='/company-settings' element={<Settings />} />
          {/* Standalone Module Settings Routes */}
          <Route path='/account-settings' element={<AccountSetting />} />
          <Route path='/production-settings' element={<ProductionSettings />} />
          <Route path='/production/finished-goods/new' element={<ProFinishedGoodForm />} />
          <Route path='/production/finished-goods/edit/:id' element={<ProFinishedGoodForm />} />
          <Route path='/production/finished-goods/:itemId/process' element={<ProcessFinishedGood />} />
          <Route path='/production/finished-goods/:itemId/bom' element={<BomFinishedGood />} />
          <Route path='/crm-settings' element={<CrmSettings />} />
          {/* The PartyType setting is a CRUD interface, so it gets its own group of routes */}
          <Route path='/company-settings/party-type'>
            <Route index element={<PartyType />} />
            <Route path="new" element={<PartyForm />} />
            <Route path="edit/:id" element={<PartyForm />} />
          </Route>
          <Route path='/crm-dashboard' element={<CrmModule />}>
            <Route index element={<CrmPlaceholder pageName="CRM Dashboard" />} />
            <Route path="home" element={<CrmHome />} />
            <Route path="calling-data" element={<CrmPlaceholder pageName="Calling Data" />} />
            <Route path="leads" element={<CrmLead pageName="Leads" />} />
            <Route path="leads/:leadId" element={<LeadInfo />} />
            <Route path="companies" element={<CrmCompanies pageName="Companies" />} />
            <Route path="contacts" element={<CrmContacts pageName="Contacts" />} />
            <Route path='products'>
              <Route index element={<CrmSalesProduct pageName="Products" />} />
              <Route path="new" element={<CrmSalesProductForm />} />
              <Route path="edit/:id" element={<CrmSalesProductForm />} />
            </Route>
            <Route path="deals" element={<CrmPlaceholder pageName="Deals" />} />
            <Route path="tasks" element={<CrmPlaceholder pageName="Tasks" />} />
            <Route path="operations" element={<CrmPlaceholder pageName="Operations" />} />
          </Route>
          {/* Sales Module Routes */}
          <Route path="/sales-dashboard" element={<SalesLayout />}>
            <Route index element={<SalesDashboard />} />
          </Route>
          <Route path="/sales" element={<SalesLayout />}>
            {/* Delivery Orders */}
            <Route path="delivery-orders">
              <Route index element={<DeliveryOrder />} />
              <Route path="new" element={<DeliveryOrderForm />} />
              <Route path="edit/:id" element={<DeliveryOrderForm />} />
              <Route path=":id" element={<DeliveryOrderView />} />
            </Route>
            <Route path='quotations'>
              <Route index element={<Quotation />} />
              <Route path='new' element={<QuotationForm />} />
              <Route path='edit/:id' element={<QuotationForm />} />
              <Route path='revise/:id' element={<QuotationForm />} />
              <Route path=':id' element={<ViewQuotation />} />
            </Route>
            <Route path='invoices'>
              <Route index element={<Invoice />} />
              <Route path='new' element={<InvoiceForm />} />
              <Route path='edit/:id' element={<InvoiceForm />} />
              <Route path=':id' element={<InvoiceView />} />
            </Route>
            <Route path="rental-quotations">
              <Route index element={<RentalQuotation />} />
              <Route path="new" element={<RentalQuotationForm />} />
              <Route path="edit/:id" element={<RentalQuotationForm />} />
              <Route path=":id" element={<RentalQuotationView />} />
            </Route>
            <Route path="rental-sales-orders">
              <Route index element={<RentalSalesOrder />} />
              <Route path="new" element={<RentalSalesOrderForm />} />
              <Route path="edit/:id" element={<RentalSalesOrderForm />} />
              <Route path=":id" element={<RentalSalesOrderView />} />
            </Route>
            <Route path="rental-item-received">
              <Route index element={<RentalItemRecieved />} />
              <Route path="new" element={<RentalItemRecievedForm />} />
              <Route path="edit/:id" element={<RentalItemRecievedForm />} />
              <Route path="by-order/:orderId" element={<RentalItemReceivedByOrder />} />
              <Route path=":id" element={<RentalItemRecievedView />} />
            </Route>

            <Route path="recieved-amounts">
              <Route index element={<RecievedAmount />} />
              <Route path="new" element={<RecievedAmountForm />} />
              <Route path="edit/:id" element={<RecievedAmountForm />} />
              <Route path=":id" element={<RecievedAmountView />} />
            </Route>

            <Route path="credit-notes">
              <Route index element={<CreditNotes />} />
              <Route path="new" element={<CreditNotesForm />} />
              <Route path="edit/:id" element={<CreditNotesForm />} />
              <Route path=":id" element={<CreditNotesView />} />
            </Route>

            <Route path="orders">
              <Route index element={<Orders />} />
              <Route path="new" element={<OrderForm />} />
              <Route path="edit/:id" element={<OrderForm />} />
              <Route path=":id" element={<ViewSales />} />
            </Route>
            <Route path="proforma-invoices">
              <Route index element={<ProformaInvoice />} />
              <Route path="new" element={<ProformaInvoiceForm />} />
              <Route path="edit/:id" element={<ProformaInvoiceForm />} />
              <Route path=":id" element={<ProformaInvoiceView />} />
            </Route>
            <Route path="rental-invoices">
              <Route index element={<RentalInvoice />} />
              <Route path="new" element={<RentalInvoiceForm />} />
              <Route path="edit/:id" element={<RentalInvoiceForm />} />
              <Route path=":id" element={<RentalInvoiceView />} />
            </Route>
            <Route path='settings' element={<SalesSetting />} />
          </Route>
          <Route path='/account-dashboard' element={<Account />}>
            <Route index element={<AccountPlaceholder pageName="Chart Of Accounts" />} />
            <Route path="chart-of-accounts" element={<AccountPlaceholder pageName="Chart Of Accounts" />} />
            <Route path="add-entry" element={<AccountPlaceholder pageName="Add Entry" />} />
            <Route path="manage-entry" element={<AccountPlaceholder pageName="Manage Entry" />} />
            <Route path="incoming-pdc" element={<AccountPlaceholder pageName="Manage Incoming PDC" />} />
            <Route path="outgoing-pdc" element={<AccountPlaceholder pageName="Manage Outgoing PDC" />} />
            <Route path="bank-reconciliation" element={<AccountPlaceholder pageName="Bank Reconciliation" />} />
          </Route>
          {/* Production Module Routes */}
          <Route path="/production-dashboard" element={<Production />}>
            <Route index element={<ManufacturingOrder />} />
            <Route path="manage-manufacturing-order" element={<ManufacturingOrder />} />
            <Route path="manage-manufacturing-order/new" element={<ManufacturingOrderForm />} />
            <Route path="manage-manufacturing-order/edit/:id" element={<ManufacturingOrderForm />} />
            <Route path="view-manufacturing-order/:id" element={<ViewManufacturingOrder />} />
            <Route path="production-schedule" element={<ProductionSchedule />} />
            <Route path="production-operation" element={<ProductionPlaceholder pageName="Production Operation" />} />
            <Route path="my-production" element={<ProductionPlaceholder pageName="My Production" />} />
            <Route path="material-requisition" element={<ProductionPlaceholder pageName="Material Requisition" />} />
            <Route path="work-order-report" element={<ProductionPlaceholder pageName="Work Order Report" />} />
          </Route>
          {/* Purchase Module Routes */}
          <Route path="/purchase-dashboard/*" element={<PurchaseModule />} />
        </Routes>
      </Router>
    </TenantProvider>
  )
}

export default App
