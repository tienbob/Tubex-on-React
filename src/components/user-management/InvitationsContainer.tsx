import React, { useEffect, useState } from 'react';
import { invitationService, Invitation } from '../../services/api/invitationService';
import InvitationsTab from './InvitationsTab';

const InvitationsContainer: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const data = await invitationService.getInvitations();
      setInvitations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleResendInvite = async (id: string) => {
    await invitationService.updateInvitation(id, { status: 'pending' });
    fetchInvitations();
  };

  const handleCancelInvite = async (id: string) => {
    await invitationService.deleteInvitation(id);
    fetchInvitations();
  };

  const openInviteDialog = () => {
    // Implement dialog logic or pass as prop from parent
  };

  return (
    <InvitationsTab
      invitations={invitations}
      loading={loading}
      openInviteDialog={openInviteDialog}
      handleResendInvite={handleResendInvite}
      handleCancelInvite={handleCancelInvite}
    />
  );
};

export default InvitationsContainer;
