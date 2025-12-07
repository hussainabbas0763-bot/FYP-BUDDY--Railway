import json
import pickle
import re
from collections import defaultdict
import math

class SimpleTFIDF:
    """A simple TF-IDF implementation without scikit-learn"""
    def __init__(self):
        self.vocab = {}
        self.idf = {}
        self.documents = []
        
    def fit_transform(self, documents):
        """Simple TF-IDF implementation"""
        self.documents = documents
        
        # Build vocabulary
        vocab_set = set()
        doc_terms = []
        
        for doc in documents:
            terms = doc.lower().split()
            doc_terms.append(terms)
            vocab_set.update(terms)
        
        # Create vocabulary mapping
        self.vocab = {term: idx for idx, term in enumerate(sorted(vocab_set))}
        
        # Calculate IDF
        n_docs = len(documents)
        for term in self.vocab:
            doc_count = sum(1 for terms in doc_terms if term in terms)
            self.idf[term] = math.log((n_docs + 1) / (doc_count + 1)) + 1
        
        # Calculate TF-IDF vectors
        vectors = []
        for terms in doc_terms:
            vector = [0] * len(self.vocab)
            term_count = defaultdict(int)
            
            # Count term frequencies
            for term in terms:
                term_count[term] += 1
            
            # Calculate TF-IDF
            for term, count in term_count.items():
                if term in self.vocab:
                    idx = self.vocab[term]
                    tf = count / len(terms)
                    vector[idx] = tf * self.idf.get(term, 1)
            
            vectors.append(vector)
        
        return vectors
    
    def transform(self, query):
        """Transform a query into TF-IDF vector"""
        if not self.vocab:
            return []
        
        terms = query.lower().split()
        vector = [0] * len(self.vocab)
        term_count = defaultdict(int)
        
        for term in terms:
            term_count[term] += 1
        
        for term, count in term_count.items():
            if term in self.vocab:
                idx = self.vocab[term]
                tf = count / len(terms) if terms else 0
                vector[idx] = tf * self.idf.get(term, 1)
        
        return vector

def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    if not vec1 or not vec2:
        return 0
    
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    
    if norm1 == 0 or norm2 == 0:
        return 0
    
    return dot_product / (norm1 * norm2)

class ProjectChatbotTrainer:
    def __init__(self):
        self.projects = []
        self.technologies = {}
        self.intents = []
        self.vectorizer = SimpleTFIDF()
        self.project_vectors = []
        self.project_texts = []
        
    def load_data(self):
        """Load data from all JSON files"""
        try:
            # Load trainingdata.json
            with open('data/trainingdata.json', 'r', encoding='utf-8') as f:
                training_data = json.load(f)
                self.projects = training_data.get('projects', [])
                print(f"✓ Loaded {len(self.projects)} projects")
            
            # Load description.json
            with open('data/description.json', 'r', encoding='utf-8') as f:
                desc_data = json.load(f)
                tech_count = 0
                for item in desc_data.get('description', []):
                    self.technologies[item['name'].lower()] = item
                    tech_count += 1
                print(f"✓ Loaded {tech_count} technologies")
            
            # Load intents.json
            with open('data/intents.json', 'r', encoding='utf-8') as f:
                intents_data = json.load(f)
                self.intents = intents_data.get('intents', [])
                print(f"✓ Loaded {len(self.intents)} intents")
                
                # Print intent tags for debugging
                print(f"  Intent tags: {[intent['tag'] for intent in self.intents]}")
            
            return True
            
        except FileNotFoundError as e:
            print(f"✗ File not found: {e}")
            return False
        except json.JSONDecodeError as e:
            print(f"✗ Invalid JSON: {e}")
            return False
        except Exception as e:
            print(f"✗ Error loading data: {e}")
            return False
    
    def prepare_project_vectors(self):
        """Prepare TF-IDF vectors for project similarity search"""
        for project in self.projects:
            # Create a combined text representation of the project
            text = f"{project['name']} {project['description']} {' '.join(project['technologies'])} {' '.join(project.get('related_topics', []))}"
            self.project_texts.append(text.lower())
        
        if self.project_texts:
            self.project_vectors = self.vectorizer.fit_transform(self.project_texts)
            print(f"✓ Created TF-IDF vectors for {len(self.project_texts)} projects")
    
    def save_trained_model(self, filename='chatbot_model.pkl'):
        """Save the trained model to a file"""
        model_data = {
            'projects': self.projects,
            'technologies': self.technologies,
            'intents': self.intents,
            'vectorizer': self.vectorizer,
            'project_vectors': self.project_vectors,
            'project_texts': self.project_texts
        }
        
        with open(filename, 'wb') as f:
            pickle.dump(model_data, f)
        print(f"✓ Model saved to {filename}")
    
    def load_trained_model(self, filename='chatbot_model.pkl'):
        """Load a trained model from file"""
        try:
            with open(filename, 'rb') as f:
                model_data = pickle.load(f)
            
            self.projects = model_data['projects']
            self.technologies = model_data['technologies']
            self.intents = model_data['intents']
            self.vectorizer = model_data['vectorizer']
            self.project_vectors = model_data['project_vectors']
            self.project_texts = model_data['project_texts']
            
            print(f"✓ Loaded trained model with:")
            print(f"  - {len(self.projects)} projects")
            print(f"  - {len(self.technologies)} technologies")
            print(f"  - {len(self.intents)} intents")
            
            # Verify all intents are loaded
            print(f"  Intent tags loaded: {[intent['tag'] for intent in self.intents]}")
            
            return True
            
        except FileNotFoundError:
            print(f"✗ Model file {filename} not found")
            return False
        except Exception as e:
            print(f"✗ Error loading model: {e}")
            return False

def main():
    """Main training function"""
    print("="*60)
    print("PROJECT CHATBOT TRAINER")
    print("="*60)
    
    trainer = ProjectChatbotTrainer()
    
    # Check if we have a saved model
    if trainer.load_trained_model():
        print("\n✓ Using pre-trained model")
    else:
        print("\n⚡ Training new model...")
        if trainer.load_data():
            trainer.prepare_project_vectors()
            trainer.save_trained_model()
        else:
            print("✗ Failed to load data. Please check your JSON files.")
            return None
    
    # Test the trainer
    print("\n" + "="*60)
    print("SAMPLE DATA LOADED:")
    print("="*60)
    
    if trainer.projects:
        print(f"First project: {trainer.projects[0]['name']}")
        print(f"Last project: {trainer.projects[-1]['name']}")
        print(f"Total projects: {len(trainer.projects)}")
    
    if trainer.intents:
        print(f"\nIntents loaded: {len(trainer.intents)}")
        for intent in trainer.intents:
            print(f"  • {intent['tag']} ({len(intent['patterns'])} patterns)")
    
    if 'python' in trainer.technologies:
        print(f"\nSample technology: Python - {trainer.technologies['python'].get('short_description', 'Not found')[:50]}...")
    
    return trainer

if __name__ == "__main__":
    trainer = main()

