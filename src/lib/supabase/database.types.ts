export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      administrateurs: {
        Row: {
          ajoute_par: string | null
          cree_le: string
          mfa_exige: boolean
          profil_id: string
          role: Database["public"]["Enums"]["role_admin"]
        }
        Insert: {
          ajoute_par?: string | null
          cree_le?: string
          mfa_exige?: boolean
          profil_id: string
          role?: Database["public"]["Enums"]["role_admin"]
        }
        Update: {
          ajoute_par?: string | null
          cree_le?: string
          mfa_exige?: boolean
          profil_id?: string
          role?: Database["public"]["Enums"]["role_admin"]
        }
        Relationships: [
          {
            foreignKeyName: "administrateurs_ajoute_par_fkey"
            columns: ["ajoute_par"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrateurs_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: true
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses_anonymes: {
        Row: {
          apercu: Json | null
          cree_le: string
          entree: Json
          expire_le: string
          fiche: Json | null
          id: string
          ip_hash: string | null
          jeton: string
          mode: string
          modifie_le: string
          pays: string | null
          profils: Json | null
          rattachee_a: string | null
          rattachee_le: string | null
        }
        Insert: {
          apercu?: Json | null
          cree_le?: string
          entree: Json
          expire_le?: string
          fiche?: Json | null
          id?: string
          ip_hash?: string | null
          jeton: string
          mode?: string
          modifie_le?: string
          pays?: string | null
          profils?: Json | null
          rattachee_a?: string | null
          rattachee_le?: string | null
        }
        Update: {
          apercu?: Json | null
          cree_le?: string
          entree?: Json
          expire_le?: string
          fiche?: Json | null
          id?: string
          ip_hash?: string | null
          jeton?: string
          mode?: string
          modifie_le?: string
          pays?: string | null
          profils?: Json | null
          rattachee_a?: string | null
          rattachee_le?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analyses_anonymes_rattachee_a_fkey"
            columns: ["rattachee_a"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses_prospects: {
        Row: {
          annuaire_entreprise_id: string
          calcule_le: string
          cout_fcfa: number
          expire_le: string
          fiche: Json
          signaux: Json
        }
        Insert: {
          annuaire_entreprise_id: string
          calcule_le?: string
          cout_fcfa?: number
          expire_le?: string
          fiche: Json
          signaux?: Json
        }
        Update: {
          annuaire_entreprise_id?: string
          calcule_le?: string
          cout_fcfa?: number
          expire_le?: string
          fiche?: Json
          signaux?: Json
        }
        Relationships: [
          {
            foreignKeyName: "analyses_prospects_annuaire_entreprise_id_fkey"
            columns: ["annuaire_entreprise_id"]
            isOneToOne: true
            referencedRelation: "annuaire_entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      annuaire_contacts: {
        Row: {
          annuaire_entreprise_id: string
          base_legale: string
          cree_le: string
          email: string | null
          id: string
          linkedin_url: string | null
          nom: string | null
          role: string | null
          source_id: string | null
          telephone: string | null
        }
        Insert: {
          annuaire_entreprise_id: string
          base_legale: string
          cree_le?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          nom?: string | null
          role?: string | null
          source_id?: string | null
          telephone?: string | null
        }
        Update: {
          annuaire_entreprise_id?: string
          base_legale?: string
          cree_le?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          nom?: string | null
          role?: string | null
          source_id?: string | null
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annuaire_contacts_annuaire_entreprise_id_fkey"
            columns: ["annuaire_entreprise_id"]
            isOneToOne: false
            referencedRelation: "annuaire_entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annuaire_contacts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "annuaire_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      annuaire_doublons: {
        Row: {
          fusionne_le: string
          id_fusionne: string
          id_garde: string
        }
        Insert: {
          fusionne_le?: string
          id_fusionne: string
          id_garde: string
        }
        Update: {
          fusionne_le?: string
          id_fusionne?: string
          id_garde?: string
        }
        Relationships: [
          {
            foreignKeyName: "annuaire_doublons_id_garde_fkey"
            columns: ["id_garde"]
            isOneToOne: false
            referencedRelation: "annuaire_entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      annuaire_entreprises: {
        Row: {
          actif: boolean
          coordonnees: unknown
          cree_le: string
          derniere_maj: string
          email: string | null
          id: string
          liens_sociaux: Json
          modifie_le: string
          nom: string
          nom_normalise: string
          pays: string
          place_id_google: string | null
          quartier: string | null
          score_qualite: number
          secteur: string | null
          site: string | null
          source_id: string | null
          source_ref: string | null
          sous_secteur: string | null
          taille: string | null
          telephone: string | null
          ville: string | null
          whatsapp: string | null
        }
        Insert: {
          actif?: boolean
          coordonnees?: unknown
          cree_le?: string
          derniere_maj?: string
          email?: string | null
          id?: string
          liens_sociaux?: Json
          modifie_le?: string
          nom: string
          nom_normalise: string
          pays: string
          place_id_google?: string | null
          quartier?: string | null
          score_qualite?: number
          secteur?: string | null
          site?: string | null
          source_id?: string | null
          source_ref?: string | null
          sous_secteur?: string | null
          taille?: string | null
          telephone?: string | null
          ville?: string | null
          whatsapp?: string | null
        }
        Update: {
          actif?: boolean
          coordonnees?: unknown
          cree_le?: string
          derniere_maj?: string
          email?: string | null
          id?: string
          liens_sociaux?: Json
          modifie_le?: string
          nom?: string
          nom_normalise?: string
          pays?: string
          place_id_google?: string | null
          quartier?: string | null
          score_qualite?: number
          secteur?: string | null
          site?: string | null
          source_id?: string | null
          source_ref?: string | null
          sous_secteur?: string | null
          taille?: string | null
          telephone?: string | null
          ville?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annuaire_entreprises_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "annuaire_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      annuaire_sources: {
        Row: {
          cree_le: string
          delai_conservation_jours: number | null
          id: string
          licence: string | null
          nom: string
          peut_revendre: boolean
          peut_stocker: boolean
        }
        Insert: {
          cree_le?: string
          delai_conservation_jours?: number | null
          id?: string
          licence?: string | null
          nom: string
          peut_revendre?: boolean
          peut_stocker?: boolean
        }
        Update: {
          cree_le?: string
          delai_conservation_jours?: number | null
          id?: string
          licence?: string | null
          nom?: string
          peut_revendre?: boolean
          peut_stocker?: boolean
        }
        Relationships: []
      }
      campagnes: {
        Row: {
          canaux_autorises: Database["public"]["Enums"]["canal"][]
          cree_le: string
          debut: string | null
          entreprise_id: string
          entreprises_contactees: number
          fin: string | null
          id: string
          modifie_le: string
          nom: string
          plafond_jour: number
          profil_cible_id: string | null
          statut: Database["public"]["Enums"]["statut_campagne"]
        }
        Insert: {
          canaux_autorises?: Database["public"]["Enums"]["canal"][]
          cree_le?: string
          debut?: string | null
          entreprise_id: string
          entreprises_contactees?: number
          fin?: string | null
          id?: string
          modifie_le?: string
          nom: string
          plafond_jour?: number
          profil_cible_id?: string | null
          statut?: Database["public"]["Enums"]["statut_campagne"]
        }
        Update: {
          canaux_autorises?: Database["public"]["Enums"]["canal"][]
          cree_le?: string
          debut?: string | null
          entreprise_id?: string
          entreprises_contactees?: number
          fin?: string | null
          id?: string
          modifie_le?: string
          nom?: string
          plafond_jour?: number
          profil_cible_id?: string | null
          statut?: Database["public"]["Enums"]["statut_campagne"]
        }
        Relationships: [
          {
            foreignKeyName: "campagnes_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campagnes_profil_cible_id_fkey"
            columns: ["profil_cible_id"]
            isOneToOne: false
            referencedRelation: "profils_cibles"
            referencedColumns: ["id"]
          },
        ]
      }
      comptes_connectes: {
        Row: {
          canal: Database["public"]["Enums"]["canal"]
          connecte_le: string
          cree_le: string
          derniere_erreur: string | null
          entreprise_id: string
          envois_aujourdhui: number
          id: string
          identifiant_affiche: string
          modifie_le: string
          note_sante: number
          quota_jour: number
          statut: Database["public"]["Enums"]["statut_compte"]
          unipile_account_id: string
          verifie_le: string | null
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal"]
          connecte_le?: string
          cree_le?: string
          derniere_erreur?: string | null
          entreprise_id: string
          envois_aujourdhui?: number
          id?: string
          identifiant_affiche: string
          modifie_le?: string
          note_sante?: number
          quota_jour?: number
          statut?: Database["public"]["Enums"]["statut_compte"]
          unipile_account_id: string
          verifie_le?: string | null
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal"]
          connecte_le?: string
          cree_le?: string
          derniere_erreur?: string | null
          entreprise_id?: string
          envois_aujourdhui?: number
          id?: string
          identifiant_affiche?: string
          modifie_le?: string
          note_sante?: number
          quota_jour?: number
          statut?: Database["public"]["Enums"]["statut_compte"]
          unipile_account_id?: string
          verifie_le?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comptes_connectes_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      controles_message: {
        Row: {
          corps_corrige: string | null
          cree_le: string
          entreprise_id: string
          id: string
          message_id: string
          motifs: string[]
          verdict: string
        }
        Insert: {
          corps_corrige?: string | null
          cree_le?: string
          entreprise_id: string
          id?: string
          message_id: string
          motifs?: string[]
          verdict: string
        }
        Update: {
          corps_corrige?: string | null
          cree_le?: string
          entreprise_id?: string
          id?: string
          message_id?: string
          motifs?: string[]
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "controles_message_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_message_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          canal: Database["public"]["Enums"]["canal"]
          compte_connecte_id: string | null
          cree_le: string
          dernier_message_le: string | null
          entreprise_id: string
          id: string
          modifie_le: string
          prospect_id: string
          reprise_par_client: boolean
          statut: string
          unipile_chat_id: string | null
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal"]
          compte_connecte_id?: string | null
          cree_le?: string
          dernier_message_le?: string | null
          entreprise_id: string
          id?: string
          modifie_le?: string
          prospect_id: string
          reprise_par_client?: boolean
          statut?: string
          unipile_chat_id?: string | null
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal"]
          compte_connecte_id?: string | null
          cree_le?: string
          dernier_message_le?: string | null
          entreprise_id?: string
          id?: string
          modifie_le?: string
          prospect_id?: string
          reprise_par_client?: boolean
          statut?: string
          unipile_chat_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_compte_connecte_id_fkey"
            columns: ["compte_connecte_id"]
            isOneToOne: false
            referencedRelation: "comptes_connectes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_compte_connecte_id_fkey"
            columns: ["compte_connecte_id"]
            isOneToOne: false
            referencedRelation: "mes_comptes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      couts_par_client: {
        Row: {
          detail: Json
          entreprise_id: string
          mois: string
          montant_fcfa: number
          poste: string
        }
        Insert: {
          detail?: Json
          entreprise_id: string
          mois: string
          montant_fcfa?: number
          poste: string
        }
        Update: {
          detail?: Json
          entreprise_id?: string
          mois?: string
          montant_fcfa?: number
          poste?: string
        }
        Relationships: [
          {
            foreignKeyName: "couts_par_client_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          contexte: Json
          conversation_id: string | null
          cree_le: string
          echeance: string | null
          entreprise_id: string
          id: string
          notifie_le: string | null
          options: Json
          prospect_id: string | null
          question: string
          repondu_le: string | null
          repondu_par: string | null
          reponse: Json | null
          statut: Database["public"]["Enums"]["statut_decision"]
          type: Database["public"]["Enums"]["type_decision"]
          urgence: number
        }
        Insert: {
          contexte?: Json
          conversation_id?: string | null
          cree_le?: string
          echeance?: string | null
          entreprise_id: string
          id?: string
          notifie_le?: string | null
          options?: Json
          prospect_id?: string | null
          question: string
          repondu_le?: string | null
          repondu_par?: string | null
          reponse?: Json | null
          statut?: Database["public"]["Enums"]["statut_decision"]
          type: Database["public"]["Enums"]["type_decision"]
          urgence?: number
        }
        Update: {
          contexte?: Json
          conversation_id?: string | null
          cree_le?: string
          echeance?: string | null
          entreprise_id?: string
          id?: string
          notifie_le?: string | null
          options?: Json
          prospect_id?: string | null
          question?: string
          repondu_le?: string | null
          repondu_par?: string | null
          reponse?: Json | null
          statut?: Database["public"]["Enums"]["statut_decision"]
          type?: Database["public"]["Enums"]["type_decision"]
          urgence?: number
        }
        Relationships: [
          {
            foreignKeyName: "decisions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_repondu_par_fkey"
            columns: ["repondu_par"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
        ]
      }
      empreintes_essai: {
        Row: {
          cree_le: string
          empreinte_hash: string
          entreprise_id: string
          type: string
        }
        Insert: {
          cree_le?: string
          empreinte_hash: string
          entreprise_id: string
          type: string
        }
        Update: {
          cree_le?: string
          empreinte_hash?: string
          entreprise_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "empreintes_essai_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      entreprises: {
        Row: {
          analyse_le: string | null
          consignes: Json
          cree_le: string
          envoi_suspendu: boolean
          facebook: string | null
          fiche_activite: Json | null
          fuseau_horaire: string
          horaires: Json
          id: string
          instagram: string | null
          mode_repartition: Database["public"]["Enums"]["mode_repartition"]
          modifie_le: string
          nom: string
          nom_affiche: string | null
          pays: string | null
          plafond_jour: number
          premier_forfait_fait: boolean
          secteur: string | null
          site: string | null
          style_valide: boolean
          ville: string | null
        }
        Insert: {
          analyse_le?: string | null
          consignes?: Json
          cree_le?: string
          envoi_suspendu?: boolean
          facebook?: string | null
          fiche_activite?: Json | null
          fuseau_horaire?: string
          horaires?: Json
          id?: string
          instagram?: string | null
          mode_repartition?: Database["public"]["Enums"]["mode_repartition"]
          modifie_le?: string
          nom: string
          nom_affiche?: string | null
          pays?: string | null
          plafond_jour?: number
          premier_forfait_fait?: boolean
          secteur?: string | null
          site?: string | null
          style_valide?: boolean
          ville?: string | null
        }
        Update: {
          analyse_le?: string | null
          consignes?: Json
          cree_le?: string
          envoi_suspendu?: boolean
          facebook?: string | null
          fiche_activite?: Json | null
          fuseau_horaire?: string
          horaires?: Json
          id?: string
          instagram?: string | null
          mode_repartition?: Database["public"]["Enums"]["mode_repartition"]
          modifie_le?: string
          nom?: string
          nom_affiche?: string | null
          pays?: string | null
          plafond_jour?: number
          premier_forfait_fait?: boolean
          secteur?: string | null
          site?: string | null
          style_valide?: boolean
          ville?: string | null
        }
        Relationships: []
      }
      etapes_sequence: {
        Row: {
          canal: Database["public"]["Enums"]["canal"] | null
          id: string
          jour: number
          modele_id: string | null
          rang: number
          sequence_id: string
          type: string
        }
        Insert: {
          canal?: Database["public"]["Enums"]["canal"] | null
          id?: string
          jour: number
          modele_id?: string | null
          rang: number
          sequence_id: string
          type: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal"] | null
          id?: string
          jour?: number
          modele_id?: string | null
          rang?: number
          sequence_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapes_sequence_modele_id_fkey"
            columns: ["modele_id"]
            isOneToOne: false
            referencedRelation: "modeles_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etapes_sequence_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      evenements_compte: {
        Row: {
          charge: Json
          compte_id: string
          cree_le: string
          gravite: number
          id: string
          type: string
        }
        Insert: {
          charge?: Json
          compte_id: string
          cree_le?: string
          gravite?: number
          id?: string
          type: string
        }
        Update: {
          charge?: Json
          compte_id?: string
          cree_le?: string
          gravite?: number
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "evenements_compte_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "comptes_connectes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_compte_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "mes_comptes"
            referencedColumns: ["id"]
          },
        ]
      }
      exclusions_client: {
        Row: {
          cree_le: string
          entreprise_id: string
          id: string
          motif: string | null
          type: string
          valeur: string
        }
        Insert: {
          cree_le?: string
          entreprise_id: string
          id?: string
          motif?: string | null
          type: string
          valeur: string
        }
        Update: {
          cree_le?: string
          entreprise_id?: string
          id?: string
          motif?: string | null
          type?: string
          valeur?: string
        }
        Relationships: [
          {
            foreignKeyName: "exclusions_client_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      file_envoi: {
        Row: {
          canal: Database["public"]["Enums"]["canal"]
          compte_connecte_id: string | null
          cree_le: string
          entreprise_id: string
          etape_sequence_id: string | null
          id: string
          modifie_le: string
          planifie_pour: string
          pris_le: string | null
          pris_par: string | null
          prospect_id: string
          statut: string
          tentatives: number
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal"]
          compte_connecte_id?: string | null
          cree_le?: string
          entreprise_id: string
          etape_sequence_id?: string | null
          id?: string
          modifie_le?: string
          planifie_pour: string
          pris_le?: string | null
          pris_par?: string | null
          prospect_id: string
          statut?: string
          tentatives?: number
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal"]
          compte_connecte_id?: string | null
          cree_le?: string
          entreprise_id?: string
          etape_sequence_id?: string | null
          id?: string
          modifie_le?: string
          planifie_pour?: string
          pris_le?: string | null
          pris_par?: string | null
          prospect_id?: string
          statut?: string
          tentatives?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_envoi_compte_connecte_id_fkey"
            columns: ["compte_connecte_id"]
            isOneToOne: false
            referencedRelation: "comptes_connectes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_envoi_compte_connecte_id_fkey"
            columns: ["compte_connecte_id"]
            isOneToOne: false
            referencedRelation: "mes_comptes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_envoi_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_envoi_etape_sequence_id_fkey"
            columns: ["etape_sequence_id"]
            isOneToOne: false
            referencedRelation: "etapes_sequence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_envoi_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      forfaits: {
        Row: {
          comptes_max: number | null
          cree_le: string
          debut: string
          entreprise_id: string
          entreprises_achetees: number
          entreprises_restantes: number
          fin: string
          gel_expire_le: string | null
          gele_le: string | null
          grace_fin: string
          id: string
          modifie_le: string
          montant_fcfa: number
          paiement_id: string | null
          par_jour: number
          prix_unitaire_fcfa: number
          statut: Database["public"]["Enums"]["statut_forfait"]
          type: Database["public"]["Enums"]["type_forfait"]
        }
        Insert: {
          comptes_max?: number | null
          cree_le?: string
          debut?: string
          entreprise_id: string
          entreprises_achetees?: number
          entreprises_restantes?: number
          fin: string
          gel_expire_le?: string | null
          gele_le?: string | null
          grace_fin: string
          id?: string
          modifie_le?: string
          montant_fcfa?: number
          paiement_id?: string | null
          par_jour: number
          prix_unitaire_fcfa?: number
          statut?: Database["public"]["Enums"]["statut_forfait"]
          type: Database["public"]["Enums"]["type_forfait"]
        }
        Update: {
          comptes_max?: number | null
          cree_le?: string
          debut?: string
          entreprise_id?: string
          entreprises_achetees?: number
          entreprises_restantes?: number
          fin?: string
          gel_expire_le?: string | null
          gele_le?: string | null
          grace_fin?: string
          id?: string
          modifie_le?: string
          montant_fcfa?: number
          paiement_id?: string | null
          par_jour?: number
          prix_unitaire_fcfa?: number
          statut?: Database["public"]["Enums"]["statut_forfait"]
          type?: Database["public"]["Enums"]["type_forfait"]
        }
        Relationships: [
          {
            foreignKeyName: "forfaits_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forfaits_paiement_id_fkey"
            columns: ["paiement_id"]
            isOneToOne: true
            referencedRelation: "paiements"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_audit: {
        Row: {
          action: string
          admin_id: string | null
          charge: Json
          cible_id: string | null
          cible_type: string | null
          cree_le: string
          id: string
          ip_hash: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          charge?: Json
          cible_id?: string | null
          cible_type?: string | null
          cree_le?: string
          id?: string
          ip_hash?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          charge?: Json
          cible_id?: string | null
          cible_type?: string | null
          cree_le?: string
          id?: string
          ip_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_audit_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "administrateurs"
            referencedColumns: ["profil_id"]
          },
        ]
      }
      journal_evenements: {
        Row: {
          acteur: string
          acteur_id: string | null
          action: string
          charge: Json
          cible_id: string | null
          cible_type: string | null
          cree_le: string
          entreprise_id: string | null
          id: string
        }
        Insert: {
          acteur: string
          acteur_id?: string | null
          action: string
          charge?: Json
          cible_id?: string | null
          cible_type?: string | null
          cree_le?: string
          entreprise_id?: string | null
          id?: string
        }
        Update: {
          acteur?: string
          acteur_id?: string | null
          action?: string
          charge?: Json
          cible_id?: string | null
          cible_type?: string | null
          cree_le?: string
          entreprise_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_evenements_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      jours_feries: {
        Row: {
          date: string
          nom: string
          pays: string
        }
        Insert: {
          date: string
          nom: string
          pays: string
        }
        Update: {
          date?: string
          nom?: string
          pays?: string
        }
        Relationships: []
      }
      membres: {
        Row: {
          cree_le: string
          entreprise_id: string
          id: string
          modifie_le: string
          profil_id: string
          role: Database["public"]["Enums"]["role_membre"]
        }
        Insert: {
          cree_le?: string
          entreprise_id: string
          id?: string
          modifie_le?: string
          profil_id: string
          role?: Database["public"]["Enums"]["role_membre"]
        }
        Update: {
          cree_le?: string
          entreprise_id?: string
          id?: string
          modifie_le?: string
          profil_id?: string
          role?: Database["public"]["Enums"]["role_membre"]
        }
        Relationships: [
          {
            foreignKeyName: "membres_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membres_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          canal: Database["public"]["Enums"]["canal"]
          classe_reponse: Database["public"]["Enums"]["classe_reponse"] | null
          conversation_id: string
          corps: string
          cree_le: string
          entreprise_id: string
          envoye_le: string | null
          erreur: string | null
          id: string
          livre_le: string | null
          lu_le: string | null
          sens: Database["public"]["Enums"]["sens_message"]
          statut: Database["public"]["Enums"]["statut_message"]
          unipile_message_id: string | null
          variante_test: string | null
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal"]
          classe_reponse?: Database["public"]["Enums"]["classe_reponse"] | null
          conversation_id: string
          corps: string
          cree_le?: string
          entreprise_id: string
          envoye_le?: string | null
          erreur?: string | null
          id?: string
          livre_le?: string | null
          lu_le?: string | null
          sens: Database["public"]["Enums"]["sens_message"]
          statut?: Database["public"]["Enums"]["statut_message"]
          unipile_message_id?: string | null
          variante_test?: string | null
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal"]
          classe_reponse?: Database["public"]["Enums"]["classe_reponse"] | null
          conversation_id?: string
          corps?: string
          cree_le?: string
          entreprise_id?: string
          envoye_le?: string | null
          erreur?: string | null
          id?: string
          livre_le?: string | null
          lu_le?: string | null
          sens?: Database["public"]["Enums"]["sens_message"]
          statut?: Database["public"]["Enums"]["statut_message"]
          unipile_message_id?: string | null
          variante_test?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_ticket: {
        Row: {
          auteur: string
          auteur_id: string | null
          corps: string
          cree_le: string
          id: string
          ticket_id: string
        }
        Insert: {
          auteur: string
          auteur_id?: string | null
          corps: string
          cree_le?: string
          id?: string
          ticket_id: string
        }
        Update: {
          auteur?: string
          auteur_id?: string | null
          corps?: string
          cree_le?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_ticket_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_ticket_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_support"
            referencedColumns: ["id"]
          },
        ]
      }
      modeles_messages: {
        Row: {
          actif: boolean
          canal: Database["public"]["Enums"]["canal"]
          categorie_cible:
            | Database["public"]["Enums"]["categorie_prospect"]
            | null
          corps: string
          cree_le: string
          entreprise_id: string | null
          id: string
          langue: string
          metier: string | null
          score: number
          variables: string[]
        }
        Insert: {
          actif?: boolean
          canal: Database["public"]["Enums"]["canal"]
          categorie_cible?:
            | Database["public"]["Enums"]["categorie_prospect"]
            | null
          corps: string
          cree_le?: string
          entreprise_id?: string | null
          id?: string
          langue?: string
          metier?: string | null
          score?: number
          variables?: string[]
        }
        Update: {
          actif?: boolean
          canal?: Database["public"]["Enums"]["canal"]
          categorie_cible?:
            | Database["public"]["Enums"]["categorie_prospect"]
            | null
          corps?: string
          cree_le?: string
          entreprise_id?: string | null
          id?: string
          langue?: string
          metier?: string | null
          score?: number
          variables?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "modeles_messages_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      mouvements_forfait: {
        Row: {
          cle_idempotence: string | null
          cree_le: string
          entreprise_id: string
          forfait_id: string
          id: string
          motif: string | null
          nombre: number
          prospect_id: string | null
          type: Database["public"]["Enums"]["type_mouvement"]
        }
        Insert: {
          cle_idempotence?: string | null
          cree_le?: string
          entreprise_id: string
          forfait_id: string
          id?: string
          motif?: string | null
          nombre: number
          prospect_id?: string | null
          type: Database["public"]["Enums"]["type_mouvement"]
        }
        Update: {
          cle_idempotence?: string | null
          cree_le?: string
          entreprise_id?: string
          forfait_id?: string
          id?: string
          motif?: string | null
          nombre?: number
          prospect_id?: string | null
          type?: Database["public"]["Enums"]["type_mouvement"]
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_forfait_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_forfait_forfait_id_fkey"
            columns: ["forfait_id"]
            isOneToOne: false
            referencedRelation: "forfaits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_forfait_forfait_id_fkey"
            columns: ["forfait_id"]
            isOneToOne: false
            referencedRelation: "mon_forfait"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_forfait_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      opt_outs: {
        Row: {
          canal: Database["public"]["Enums"]["canal"]
          cree_le: string
          id: string
          identifiant_hash: string
          raison: string
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal"]
          cree_le?: string
          id?: string
          identifiant_hash: string
          raison: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal"]
          cree_le?: string
          id?: string
          identifiant_hash?: string
          raison?: string
        }
        Relationships: []
      }
      paiements: {
        Row: {
          confirme_le: string | null
          cree_le: string
          entreprise_id: string
          id: string
          modifie_le: string
          montant_fcfa: number
          moyen: string
          prestataire: string
          reference_prestataire: string | null
          statut: Database["public"]["Enums"]["statut_paiement"]
        }
        Insert: {
          confirme_le?: string | null
          cree_le?: string
          entreprise_id: string
          id?: string
          modifie_le?: string
          montant_fcfa: number
          moyen: string
          prestataire: string
          reference_prestataire?: string | null
          statut?: Database["public"]["Enums"]["statut_paiement"]
        }
        Update: {
          confirme_le?: string | null
          cree_le?: string
          entreprise_id?: string
          id?: string
          modifie_le?: string
          montant_fcfa?: number
          moyen?: string
          prestataire?: string
          reference_prestataire?: string | null
          statut?: Database["public"]["Enums"]["statut_paiement"]
        }
        Relationships: [
          {
            foreignKeyName: "paiements_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      paliers_forfait: {
        Row: {
          bonus_fidelite_pct: number
          cibles_max: number | null
          comptes_max: number | null
          montant_min: number
          par_jour: number
          prix_unitaire: number
        }
        Insert: {
          bonus_fidelite_pct?: number
          cibles_max?: number | null
          comptes_max?: number | null
          montant_min: number
          par_jour: number
          prix_unitaire: number
        }
        Update: {
          bonus_fidelite_pct?: number
          cibles_max?: number | null
          comptes_max?: number | null
          montant_min?: number
          par_jour?: number
          prix_unitaire?: number
        }
        Relationships: []
      }
      profils: {
        Row: {
          cree_le: string
          id: string
          langue: string
          modifie_le: string
          nom: string | null
          pays: string | null
          prenom: string | null
          telephone_whatsapp: string | null
          whatsapp_verifie_le: string | null
        }
        Insert: {
          cree_le?: string
          id: string
          langue?: string
          modifie_le?: string
          nom?: string | null
          pays?: string | null
          prenom?: string | null
          telephone_whatsapp?: string | null
          whatsapp_verifie_le?: string | null
        }
        Update: {
          cree_le?: string
          id?: string
          langue?: string
          modifie_le?: string
          nom?: string | null
          pays?: string | null
          prenom?: string | null
          telephone_whatsapp?: string | null
          whatsapp_verifie_le?: string | null
        }
        Relationships: []
      }
      profils_cibles: {
        Row: {
          actif: boolean
          cree_le: string
          entreprise_id: string
          explication: string | null
          id: string
          modifie_le: string
          nom: string
          note: number | null
          pays: string[]
          secteurs: string[]
          signaux_recherches: string[]
          tailles: string[]
          villes: string[]
        }
        Insert: {
          actif?: boolean
          cree_le?: string
          entreprise_id: string
          explication?: string | null
          id?: string
          modifie_le?: string
          nom: string
          note?: number | null
          pays?: string[]
          secteurs?: string[]
          signaux_recherches?: string[]
          tailles?: string[]
          villes?: string[]
        }
        Update: {
          actif?: boolean
          cree_le?: string
          entreprise_id?: string
          explication?: string | null
          id?: string
          modifie_le?: string
          nom?: string
          note?: number | null
          pays?: string[]
          secteurs?: string[]
          signaux_recherches?: string[]
          tailles?: string[]
          villes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "profils_cibles_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          annuaire_entreprise_id: string | null
          campagne_id: string | null
          canal_choisi: Database["public"]["Enums"]["canal"] | null
          canaux_essayes: Database["public"]["Enums"]["canal"][]
          categorie: Database["public"]["Enums"]["categorie_prospect"]
          contact_nom: string | null
          contact_role: string | null
          contacte_le: string | null
          entreprise_id: string
          id: string
          importe_le: string
          langue: string
          modifie_le: string
          nom: string
          origine: string
          repondu_le: string | null
          score: number | null
          secteur: string | null
          signal: string | null
          statut: Database["public"]["Enums"]["statut_prospect"]
          ville: string | null
        }
        Insert: {
          annuaire_entreprise_id?: string | null
          campagne_id?: string | null
          canal_choisi?: Database["public"]["Enums"]["canal"] | null
          canaux_essayes?: Database["public"]["Enums"]["canal"][]
          categorie?: Database["public"]["Enums"]["categorie_prospect"]
          contact_nom?: string | null
          contact_role?: string | null
          contacte_le?: string | null
          entreprise_id: string
          id?: string
          importe_le?: string
          langue?: string
          modifie_le?: string
          nom: string
          origine?: string
          repondu_le?: string | null
          score?: number | null
          secteur?: string | null
          signal?: string | null
          statut?: Database["public"]["Enums"]["statut_prospect"]
          ville?: string | null
        }
        Update: {
          annuaire_entreprise_id?: string | null
          campagne_id?: string | null
          canal_choisi?: Database["public"]["Enums"]["canal"] | null
          canaux_essayes?: Database["public"]["Enums"]["canal"][]
          categorie?: Database["public"]["Enums"]["categorie_prospect"]
          contact_nom?: string | null
          contact_role?: string | null
          contacte_le?: string | null
          entreprise_id?: string
          id?: string
          importe_le?: string
          langue?: string
          modifie_le?: string
          nom?: string
          origine?: string
          repondu_le?: string | null
          score?: number | null
          secteur?: string | null
          signal?: string | null
          statut?: Database["public"]["Enums"]["statut_prospect"]
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_annuaire_entreprise_id_fkey"
            columns: ["annuaire_entreprise_id"]
            isOneToOne: false
            referencedRelation: "annuaire_entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects_identifiants: {
        Row: {
          canal: Database["public"]["Enums"]["canal"]
          entreprise_id: string
          id: string
          identifiant: string
          prospect_id: string
          source: string | null
          verifie: boolean
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal"]
          entreprise_id: string
          id?: string
          identifiant: string
          prospect_id: string
          source?: string | null
          verifie?: boolean
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal"]
          entreprise_id?: string
          id?: string
          identifiant?: string
          prospect_id?: string
          source?: string | null
          verifie?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "prospects_identifiants_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_identifiants_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      reglages_forfait: {
        Row: {
          cle: string
          valeur: number
        }
        Insert: {
          cle: string
          valeur: number
        }
        Update: {
          cle?: string
          valeur?: number
        }
        Relationships: []
      }
      rendez_vous: {
        Row: {
          calendrier_event_id: string | null
          cree_le: string
          debut: string
          entreprise_id: string
          fin: string
          fuseau: string
          id: string
          lien_visio: string | null
          lieu: string | null
          modifie_le: string
          prospect_id: string | null
          rappels_envoyes: Json
          resultat: string | null
          statut: Database["public"]["Enums"]["statut_rdv"]
        }
        Insert: {
          calendrier_event_id?: string | null
          cree_le?: string
          debut: string
          entreprise_id: string
          fin: string
          fuseau?: string
          id?: string
          lien_visio?: string | null
          lieu?: string | null
          modifie_le?: string
          prospect_id?: string | null
          rappels_envoyes?: Json
          resultat?: string | null
          statut?: Database["public"]["Enums"]["statut_rdv"]
        }
        Update: {
          calendrier_event_id?: string | null
          cree_le?: string
          debut?: string
          entreprise_id?: string
          fin?: string
          fuseau?: string
          id?: string
          lien_visio?: string | null
          lieu?: string | null
          modifie_le?: string
          prospect_id?: string | null
          rappels_envoyes?: Json
          resultat?: string | null
          statut?: Database["public"]["Enums"]["statut_rdv"]
        }
        Relationships: [
          {
            foreignKeyName: "rendez_vous_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          actif: boolean
          categorie_cible:
            | Database["public"]["Enums"]["categorie_prospect"]
            | null
          cree_le: string
          entreprise_id: string | null
          id: string
          nom: string
        }
        Insert: {
          actif?: boolean
          categorie_cible?:
            | Database["public"]["Enums"]["categorie_prospect"]
            | null
          cree_le?: string
          entreprise_id?: string | null
          id?: string
          nom: string
        }
        Update: {
          actif?: boolean
          categorie_cible?:
            | Database["public"]["Enums"]["categorie_prospect"]
            | null
          cree_le?: string
          entreprise_id?: string | null
          id?: string
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequences_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          campagne_lancee_id: string | null
          canaux: Database["public"]["Enums"]["canal"][]
          cree_le: string
          entreprise_id: string
          hypotheses: Json
          id: string
          montant_fcfa: number
          profil_cible_id: string | null
          resultat: Json
        }
        Insert: {
          campagne_lancee_id?: string | null
          canaux?: Database["public"]["Enums"]["canal"][]
          cree_le?: string
          entreprise_id: string
          hypotheses?: Json
          id?: string
          montant_fcfa: number
          profil_cible_id?: string | null
          resultat?: Json
        }
        Update: {
          campagne_lancee_id?: string | null
          canaux?: Database["public"]["Enums"]["canal"][]
          cree_le?: string
          entreprise_id?: string
          hypotheses?: Json
          id?: string
          montant_fcfa?: number
          profil_cible_id?: string | null
          resultat?: Json
        }
        Relationships: [
          {
            foreignKeyName: "simulations_campagne_lancee_id_fkey"
            columns: ["campagne_lancee_id"]
            isOneToOne: false
            referencedRelation: "campagnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_profil_cible_id_fkey"
            columns: ["profil_cible_id"]
            isOneToOne: false
            referencedRelation: "profils_cibles"
            referencedColumns: ["id"]
          },
        ]
      }
      stats_canal: {
        Row: {
          canal: Database["public"]["Enums"]["canal"]
          categorie: Database["public"]["Enums"]["categorie_prospect"]
          envoyes: number
          livres: number
          pays: string
          periode: string
          positives: number
          rdv: number
          reponses: number
          secteur: string
          taux_positif: number | null
          taux_rdv: number | null
          taux_reponse: number | null
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal"]
          categorie: Database["public"]["Enums"]["categorie_prospect"]
          envoyes?: number
          livres?: number
          pays: string
          periode: string
          positives?: number
          rdv?: number
          reponses?: number
          secteur?: string
          taux_positif?: number | null
          taux_rdv?: number | null
          taux_reponse?: number | null
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal"]
          categorie?: Database["public"]["Enums"]["categorie_prospect"]
          envoyes?: number
          livres?: number
          pays?: string
          periode?: string
          positives?: number
          rdv?: number
          reponses?: number
          secteur?: string
          taux_positif?: number | null
          taux_rdv?: number | null
          taux_reponse?: number | null
        }
        Relationships: []
      }
      tentatives: {
        Row: {
          action: string
          cle: string
          cree_le: string
          id: string
        }
        Insert: {
          action: string
          cle: string
          cree_le?: string
          id?: string
        }
        Update: {
          action?: string
          cle?: string
          cree_le?: string
          id?: string
        }
        Relationships: []
      }
      tests_messages: {
        Row: {
          actif: boolean
          envoyes: number
          id: string
          modele_id: string
          positives: number
          variante: string
        }
        Insert: {
          actif?: boolean
          envoyes?: number
          id?: string
          modele_id: string
          positives?: number
          variante: string
        }
        Update: {
          actif?: boolean
          envoyes?: number
          id?: string
          modele_id?: string
          positives?: number
          variante?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_messages_modele_id_fkey"
            columns: ["modele_id"]
            isOneToOne: false
            referencedRelation: "modeles_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_support: {
        Row: {
          assigne_a: string | null
          cree_le: string
          entreprise_id: string | null
          id: string
          modifie_le: string
          ouvert_par: string | null
          priorite: number
          resolu_le: string | null
          statut: Database["public"]["Enums"]["statut_ticket"]
          sujet: string
        }
        Insert: {
          assigne_a?: string | null
          cree_le?: string
          entreprise_id?: string | null
          id?: string
          modifie_le?: string
          ouvert_par?: string | null
          priorite?: number
          resolu_le?: string | null
          statut?: Database["public"]["Enums"]["statut_ticket"]
          sujet: string
        }
        Update: {
          assigne_a?: string | null
          cree_le?: string
          entreprise_id?: string | null
          id?: string
          modifie_le?: string
          ouvert_par?: string | null
          priorite?: number
          resolu_le?: string | null
          statut?: Database["public"]["Enums"]["statut_ticket"]
          sujet?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_support_assigne_a_fkey"
            columns: ["assigne_a"]
            isOneToOne: false
            referencedRelation: "administrateurs"
            referencedColumns: ["profil_id"]
          },
          {
            foreignKeyName: "tickets_support_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_support_ouvert_par_fkey"
            columns: ["ouvert_par"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
        ]
      }
      verrou_contact: {
        Row: {
          canal: Database["public"]["Enums"]["canal"]
          dernier_premier_message_le: string
          identifiant_hash: string
          nombre_total: number
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal"]
          dernier_premier_message_le?: string
          identifiant_hash: string
          nombre_total?: number
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal"]
          dernier_premier_message_le?: string
          identifiant_hash?: string
          nombre_total?: number
        }
        Relationships: []
      }
    }
    Views: {
      mes_comptes: {
        Row: {
          canal: Database["public"]["Enums"]["canal"] | null
          connecte_le: string | null
          entreprise_id: string | null
          envois_aujourdhui: number | null
          id: string | null
          identifiant_affiche: string | null
          note_sante: number | null
          quota_jour: number | null
          statut: Database["public"]["Enums"]["statut_compte"] | null
        }
        Insert: {
          canal?: Database["public"]["Enums"]["canal"] | null
          connecte_le?: string | null
          entreprise_id?: string | null
          envois_aujourdhui?: number | null
          id?: string | null
          identifiant_affiche?: string | null
          note_sante?: number | null
          quota_jour?: number | null
          statut?: Database["public"]["Enums"]["statut_compte"] | null
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal"] | null
          connecte_le?: string | null
          entreprise_id?: string | null
          envois_aujourdhui?: number | null
          id?: string | null
          identifiant_affiche?: string | null
          note_sante?: number | null
          quota_jour?: number | null
          statut?: Database["public"]["Enums"]["statut_compte"] | null
        }
        Relationships: [
          {
            foreignKeyName: "comptes_connectes_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      mon_forfait: {
        Row: {
          comptes_max: number | null
          debut: string | null
          entreprise_id: string | null
          entreprises_achetees: number | null
          entreprises_restantes: number | null
          fin: string | null
          gel_expire_le: string | null
          grace_fin: string | null
          id: string | null
          montant_fcfa: number | null
          par_jour: number | null
          prix_unitaire_fcfa: number | null
          statut: Database["public"]["Enums"]["statut_forfait"] | null
          type: Database["public"]["Enums"]["type_forfait"] | null
        }
        Insert: {
          comptes_max?: number | null
          debut?: string | null
          entreprise_id?: string | null
          entreprises_achetees?: number | null
          entreprises_restantes?: number | null
          fin?: string | null
          gel_expire_le?: string | null
          grace_fin?: string | null
          id?: string | null
          montant_fcfa?: number | null
          par_jour?: number | null
          prix_unitaire_fcfa?: number | null
          statut?: Database["public"]["Enums"]["statut_forfait"] | null
          type?: Database["public"]["Enums"]["type_forfait"] | null
        }
        Update: {
          comptes_max?: number | null
          debut?: string | null
          entreprise_id?: string | null
          entreprises_achetees?: number | null
          entreprises_restantes?: number | null
          fin?: string | null
          gel_expire_le?: string | null
          grace_fin?: string | null
          id?: string | null
          montant_fcfa?: number | null
          par_jour?: number | null
          prix_unitaire_fcfa?: number | null
          statut?: Database["public"]["Enums"]["statut_forfait"] | null
          type?: Database["public"]["Enums"]["type_forfait"] | null
        }
        Relationships: [
          {
            foreignKeyName: "forfaits_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acheter_forfait: {
        Args: { p_entreprise: string; p_montant: number; p_paiement: string }
        Returns: string
      }
      admin_resume_clients: {
        Args: never
        Returns: {
          comptes_actifs: number
          entreprise_id: string
          entreprises_restantes: number
          fin: string
          forfait_statut: Database["public"]["Enums"]["statut_forfait"]
          nom: string
          pays: string
        }[]
      }
      apercu_annuaire: {
        Args: {
          p_pays: string
          p_secteurs?: string[]
          p_tailles?: string[]
          p_villes?: string[]
        }
        Returns: Json
      }
      appliquer_echeances_forfaits: {
        Args: never
        Returns: {
          essais_clos: number
          expires: number
          geles: number
          passes_en_grace: number
        }[]
      }
      decompter_entreprise: {
        Args: { p_cle: string; p_entreprise: string; p_prospect: string }
        Returns: boolean
      }
      demarrer_essai: {
        Args: {
          p_entreprise: string
          p_gmail: string
          p_site: string
          p_whatsapp: string
        }
        Returns: string
      }
      empreinte: { Args: { p_texte: string }; Returns: string }
      hacher_identifiant: {
        Args: {
          p_canal: Database["public"]["Enums"]["canal"]
          p_identifiant: string
        }
        Returns: string
      }
      normaliser_identifiant: {
        Args: {
          p_canal: Database["public"]["Enums"]["canal"]
          p_identifiant: string
        }
        Returns: string
      }
      rechercher_annuaire: {
        Args: {
          p_entreprise: string
          p_limite?: number
          p_profil_cible: string
        }
        Returns: {
          email: string
          id: string
          liens_sociaux: Json
          nom: string
          score_qualite: number
          secteur: string
          taille: string
          ville: string
          whatsapp: string
        }[]
      }
      reglage: { Args: { p_cle: string }; Returns: number }
      reinitialiser_limite: {
        Args: { p_action: string; p_cle: string }
        Returns: undefined
      }
      remettre_compteurs_comptes: { Args: never; Returns: number }
      rendre_entreprise: {
        Args: { p_cle_decompte: string; p_cle_retour: string }
        Returns: boolean
      }
      verifier_limite: {
        Args: {
          p_action: string
          p_cle: string
          p_fenetre: string
          p_maximum: number
        }
        Returns: boolean
      }
    }
    Enums: {
      canal: "whatsapp" | "instagram" | "facebook" | "linkedin" | "email"
      categorie_prospect: "grande_entreprise" | "pme" | "independant"
      classe_reponse:
        | "interesse"
        | "question"
        | "pas_maintenant"
        | "pas_interesse"
        | "mauvaise_personne"
        | "stop"
        | "absent"
        | "hostile"
        | "note_vocale"
      mode_repartition: "automatique" | "manuel"
      role_admin: "admin" | "support"
      role_membre: "proprietaire" | "membre"
      sens_message: "sortant" | "entrant"
      statut_campagne: "brouillon" | "active" | "en_pause" | "terminee"
      statut_compte: "actif" | "a_rebrancher" | "suspendu" | "debranche"
      statut_decision: "ouverte" | "repondue" | "expiree" | "annulee"
      statut_forfait: "actif" | "grace" | "gele" | "epuise" | "expire"
      statut_message:
        | "planifie"
        | "en_attente"
        | "envoye"
        | "livre"
        | "lu"
        | "echoue"
        | "annule"
      statut_paiement: "en_attente" | "reussi" | "echoue" | "rembourse"
      statut_prospect:
        | "nouveau"
        | "analyse"
        | "en_sequence"
        | "en_conversation"
        | "interesse"
        | "rdv_pris"
        | "refuse"
        | "stop"
        | "epuise"
      statut_rdv: "propose" | "confirme" | "annule" | "honore" | "non_venu"
      statut_ticket: "ouvert" | "en_cours" | "attente_client" | "resolu"
      type_decision:
        | "lead_chaud"
        | "question_prospect"
        | "confirmer_rdv"
        | "valider_information"
        | "note_vocale"
        | "forfait_bientot_fini"
        | "compte_a_rebrancher"
      type_forfait: "essai" | "payant"
      type_mouvement:
        | "achat"
        | "bonus"
        | "decompte"
        | "retour"
        | "report"
        | "gel"
        | "degel"
        | "expiration"
        | "ajustement"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      canal: ["whatsapp", "instagram", "facebook", "linkedin", "email"],
      categorie_prospect: ["grande_entreprise", "pme", "independant"],
      classe_reponse: [
        "interesse",
        "question",
        "pas_maintenant",
        "pas_interesse",
        "mauvaise_personne",
        "stop",
        "absent",
        "hostile",
        "note_vocale",
      ],
      mode_repartition: ["automatique", "manuel"],
      role_admin: ["admin", "support"],
      role_membre: ["proprietaire", "membre"],
      sens_message: ["sortant", "entrant"],
      statut_campagne: ["brouillon", "active", "en_pause", "terminee"],
      statut_compte: ["actif", "a_rebrancher", "suspendu", "debranche"],
      statut_decision: ["ouverte", "repondue", "expiree", "annulee"],
      statut_forfait: ["actif", "grace", "gele", "epuise", "expire"],
      statut_message: [
        "planifie",
        "en_attente",
        "envoye",
        "livre",
        "lu",
        "echoue",
        "annule",
      ],
      statut_paiement: ["en_attente", "reussi", "echoue", "rembourse"],
      statut_prospect: [
        "nouveau",
        "analyse",
        "en_sequence",
        "en_conversation",
        "interesse",
        "rdv_pris",
        "refuse",
        "stop",
        "epuise",
      ],
      statut_rdv: ["propose", "confirme", "annule", "honore", "non_venu"],
      statut_ticket: ["ouvert", "en_cours", "attente_client", "resolu"],
      type_decision: [
        "lead_chaud",
        "question_prospect",
        "confirmer_rdv",
        "valider_information",
        "note_vocale",
        "forfait_bientot_fini",
        "compte_a_rebrancher",
      ],
      type_forfait: ["essai", "payant"],
      type_mouvement: [
        "achat",
        "bonus",
        "decompte",
        "retour",
        "report",
        "gel",
        "degel",
        "expiration",
        "ajustement",
      ],
    },
  },
} as const
