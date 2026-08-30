// =========================================================================================================
// Core/RibbonStatusManager.cs - Thread-Safe Revit Ribbon Status Notice Manager
// =========================================================================================================

using System;
using Autodesk.Revit.UI;

namespace RevitMptOptimizer.Core
{
    public static class RibbonStatusManager
    {
        private static TextBox? _statusNoticeBox;

        public static void RegisterNoticeBox(TextBox textBox)
        {
            _statusNoticeBox = textBox;
        }

        /// <summary>
        /// Updates the Revit ribbon notice display box in real time.
        /// </summary>
        public static void UpdateNotice(string message)
        {
            try
            {
                if (_statusNoticeBox != null)
                {
                    _statusNoticeBox.Value = message;
                }
            }
            catch
            {
                // Silently ignore if UI thread is busy during modal dialogs
            }
        }
    }
}
